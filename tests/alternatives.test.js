import test from "node:test";
import assert from "node:assert/strict";

import { findAlternativeRoutes } from "../src/engine/alternatives.js";
import { createGraph, routeCost } from "../src/engine/graph.js";
import { defaultNetwork } from "../src/scenarios/defaultNetwork.js";

const graph = createGraph(defaultNetwork);

test("findAlternativeRoutes returns unique path variants", () => {
  const routes = findAlternativeRoutes(graph, "hub", "depot", { count: 4 });

  const uniqueIds = new Set(routes.map((route) => route.path.join("->")));
  assert.equal(routes.length >= 2, true);
  assert.equal(uniqueIds.size, routes.length);
});

test("alternative routes are ordered by distance", () => {
  const routes = findAlternativeRoutes(graph, "hub", "depot", { count: 4 });

  for (let i = 1; i < routes.length; i += 1) {
    assert.equal(routes[i - 1].distance <= routes[i].distance, true);
  }
});

test("alternative routes report their real cost, not the penalised one", () => {
  const routes = findAlternativeRoutes(graph, "hub", "depot", { count: 4 });
  for (const route of routes) {
    assert.equal(route.distance, routeCost(graph, route.path), route.path.join(">"));
  }
  const distances = routes.map((r) => r.distance);
  assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
});
