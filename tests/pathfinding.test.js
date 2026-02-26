import test from "node:test";
import assert from "node:assert/strict";

import { createGraph } from "../src/engine/graph.js";
import { aStar, dijkstra } from "../src/engine/pathfinding.js";
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
