import test from "node:test";
import assert from "node:assert/strict";

import { createGraph } from "../src/engine/graph.js";
import { planRoute, simulateMission } from "../src/engine/mission.js";
import { generateTrafficIncidents } from "../src/engine/traffic.js";
import { defaultNetwork } from "../src/scenarios/defaultNetwork.js";

const graph = createGraph(defaultNetwork);

test("planRoute returns primary and alternative options", () => {
  const incidents = generateTrafficIncidents(graph, { seed: 7, tick: 0, intensity: 0.5 });
  const report = planRoute(graph, {
    start: "hub",
    end: "depot",
    mode: "astar",
    incidents,
    alternativesCount: 3
  });

  assert.equal(report.primary.path.length > 0, true);
  assert.equal(report.alternatives.length >= 1, true);
  assert.equal(report.traffic.count, incidents.length);
});

test("simulateMission is deterministic for fixed seed", () => {
  const options = {
    start: "hub",
    stops: ["north", "market", "depot"],
    mode: "astar",
    seed: 33,
    intensity: 0.52,
    serviceMinutes: 2
  };

  const first = simulateMission(graph, options);
  const second = simulateMission(graph, options);

  assert.deepEqual(first, second);
  assert.equal(first.legs.length, 3);
});

test("simulateMission tracks all requested stops", () => {
  const report = simulateMission(graph, {
    start: "hub",
    stops: ["south", "depot"],
    mode: "dijkstra",
    seed: 9,
    intensity: 0.4,
    serviceMinutes: 1
  });

  assert.deepEqual(report.missionStops, ["south", "depot"]);
  assert.equal(report.totalEstimatedMinutes > 0, true);
  assert.equal(report.reliability <= 100 && report.reliability >= 35, true);
});
