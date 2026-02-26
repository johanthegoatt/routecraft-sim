import test from "node:test";
import assert from "node:assert/strict";

import { createGraph } from "../src/engine/graph.js";
import { buildTrafficMap, generateTrafficIncidents, summarizeIncidents } from "../src/engine/traffic.js";
import { defaultNetwork } from "../src/scenarios/defaultNetwork.js";

const graph = createGraph(defaultNetwork);

test("generateTrafficIncidents is deterministic for same seed and tick", () => {
  const first = generateTrafficIncidents(graph, { seed: 41, tick: 2, intensity: 0.5 });
  const second = generateTrafficIncidents(graph, { seed: 41, tick: 2, intensity: 0.5 });

  assert.deepEqual(first, second);
});

test("buildTrafficMap indexes incidents by directed edge", () => {
  const incidents = [
    { from: "hub", to: "east", multiplier: 1.8 },
    { from: "east", to: "depot", multiplier: 2.1 }
  ];

  const trafficMap = buildTrafficMap(incidents);
  assert.equal(trafficMap["hub::east"], 1.8);
  assert.equal(trafficMap["east::depot"], 2.1);
});

test("summarizeIncidents reports severe count and average", () => {
  const summary = summarizeIncidents([
    { multiplier: 1.2 },
    { multiplier: 2.8 },
    { multiplier: 2.1 }
  ]);

  assert.equal(summary.count, 3);
  assert.equal(summary.severeCount, 2);
  assert.equal(summary.averageMultiplier, 2.03);
});
