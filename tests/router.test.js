import test from "node:test";
import assert from "node:assert/strict";

import { dijkstra, estimateRouteCost, planMultiStopRoute } from "../src/router.js";

const graph = {
  a: { b: 2, c: 5 },
  b: { a: 2, c: 1, d: 4 },
  c: { a: 5, b: 1, d: 1 },
  d: { b: 4, c: 1 }
};

test("dijkstra finds shortest route", () => {
  const result = dijkstra(graph, "a", "d");
  assert.equal(result.distance, 4);
  assert.deepEqual(result.path, ["a", "b", "c", "d"]);
});

test("estimateRouteCost sums explicit path cost", () => {
  const cost = estimateRouteCost(graph, ["a", "b", "d"]);
  assert.equal(cost, 6);
});

test("planMultiStopRoute visits all requested stops", () => {
  const plan = planMultiStopRoute(graph, "a", ["c", "d"]);

  assert.equal(plan.orderedStops.includes("c"), true);
  assert.equal(plan.orderedStops.includes("d"), true);
  assert.equal(plan.totalDistance > 0, true);
  assert.equal(plan.fullPath[0], "a");
  assert.deepEqual(plan.unresolvedStops, []);
});

test("planMultiStopRoute reports unresolved stops when graph is disconnected", () => {
  const disconnected = {
    a: { b: 1 },
    b: { a: 1 },
    z: {}
  };

  const plan = planMultiStopRoute(disconnected, "a", ["z"]);
  assert.deepEqual(plan.orderedStops, []);
  assert.deepEqual(plan.unresolvedStops, ["z"]);
});

// Stops sit on a line at -2, +1 and +10 from the start. Nearest-neighbour
// goes +1, -2, +10 for 1 + 3 + 12 = 16; the best order is -2, +1, +10 for 14.
const line = {
  s: { a: 1, b: 2 },
  a: { s: 1, c: 9 },
  b: { s: 2 },
  c: { a: 9 }
};

test("planMultiStopRoute beats nearest-neighbour where greedy is wrong", () => {
  const plan = planMultiStopRoute(line, "s", ["a", "b", "c"]);
  assert.equal(plan.method, "held-karp");
  assert.equal(plan.greedyDistance, 16);
  assert.equal(plan.totalDistance, 14);
  assert.deepEqual(plan.orderedStops, ["b", "a", "c"]);
  assert.deepEqual(plan.fullPath, ["s", "b", "s", "a", "c"]);
});

test("held-karp matches brute force on random one-way graphs", () => {
  let seed = 11;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const permute = (xs) =>
    xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));

  for (let round = 0; round < 15; round += 1) {
    const names = ["n0", "n1", "n2", "n3", "n4", "n5", "n6"];
    const adjacency = Object.fromEntries(names.map((name) => [name, {}]));
    for (const a of names) {
      for (const b of names) if (a !== b && rand() < 0.5) adjacency[a][b] = 1 + Math.floor(rand() * 20);
    }
    for (let i = 1; i < names.length; i += 1) {
      adjacency[names[i - 1]][names[i]] ??= 30;
      adjacency[names[i]][names[i - 1]] ??= 30;
    }

    const stops = names.slice(1);
    const plan = planMultiStopRoute(adjacency, "n0", stops);
    const best = Math.min(
      ...permute(stops).map((order) => {
        let total = 0;
        let at = "n0";
        for (const stop of order) {
          total += dijkstra(adjacency, at, stop).distance;
          at = stop;
        }
        return total;
      })
    );
    assert.ok(Math.abs(plan.totalDistance - best) < 1e-6, `round ${round}: ${plan.totalDistance} vs ${best}`);
    assert.ok(plan.totalDistance <= plan.greedyDistance);
  }
});

test("2-opt takes over past the exact limit and never loses to greedy", () => {
  const n = 18;
  const adjacency = {};
  for (let i = 0; i < n; i += 1) adjacency[`p${i}`] = {};
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i !== j) adjacency[`p${i}`][`p${j}`] = Math.abs(((i * 7) % n) - ((j * 7) % n)) + 1;
    }
  }
  const plan = planMultiStopRoute(adjacency, "p0", Object.keys(adjacency).slice(1));
  assert.equal(plan.method, "2-opt");
  assert.equal(plan.orderedStops.length, n - 1);
  assert.ok(plan.totalDistance <= plan.greedyDistance);
});
