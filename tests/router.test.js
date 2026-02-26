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
