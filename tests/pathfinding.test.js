import test from "node:test";
import assert from "node:assert/strict";

import { createGraph } from "../src/engine/graph.js";
import { aStar, dijkstra, heuristicScale } from "../src/engine/pathfinding.js";
import { defaultNetwork } from "../src/scenarios/defaultNetwork.js";

const graph = createGraph(defaultNetwork);

test("dijkstra computes known shortest path for hub -> depot", () => {
  const result = dijkstra(graph, "hub", "depot");

  assert.equal(result.distance, 11);
  assert.deepEqual(result.path, ["hub", "east", "depot"]);
});

test("astar returns same shortest distance as dijkstra", () => {
  const left = dijkstra(graph, "hub", "depot");
  const right = aStar(graph, "hub", "depot");

  assert.equal(right.distance, left.distance);
  assert.equal(right.path[0], "hub");
  assert.equal(right.path.at(-1), "depot");
});

test("traffic multipliers can change route selection", () => {
  const result = dijkstra(graph, "hub", "depot", {
    trafficMap: {
      "hub::east": 2.3
    }
  });

  assert.deepEqual(result.path, ["hub", "north", "east", "depot"]);
  assert.equal(result.distance, 12);
});

test("astar finds the true shortest route between every pair, with and without traffic", () => {
  const ids = Object.keys(graph.nodes);
  const trafficMap = { "hub::east": 3, "east::depot": 0.6, "north::east": 1.8 };
  for (const options of [{}, { trafficMap }]) {
    for (const from of ids) {
      for (const to of ids) {
        const best = dijkstra(graph, from, to, options).distance;
        assert.equal(aStar(graph, from, to, options).distance, best, `${from} -> ${to}`);
      }
    }
  }
});

test("the heuristic scale is the cheapest cost per unit of map distance", () => {
  const tiny = createGraph({
    nodes: { a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, c: { x: 10, y: 5 } },
    edges: { a: { b: 2 }, b: { c: 5 } }
  });
  assert.equal(heuristicScale(tiny), 0.2);
  assert.equal(heuristicScale(tiny, { trafficMap: { "a::b": 2 } }), 0.4);
});
