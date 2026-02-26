import { createRng, randomInt, shuffle } from "../lib/random.js";
import { edgeKey, edgeList } from "./graph.js";

function bounded(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildTrafficMap(incidents = []) {
  const map = {};
  for (const incident of incidents) {
    map[edgeKey(incident.from, incident.to)] = incident.multiplier;
  }
  return map;
}

export function generateTrafficIncidents(graph, options = {}) {
  const seed = Number(options.seed || 1);
  const tick = Number(options.tick || 0);
  const intensity = bounded(Number(options.intensity ?? 0.4), 0.05, 0.95);
  const maxIncidents = Math.max(1, Number(options.maxIncidents || 4));

  const rng = createRng(seed + tick * 1013 + 17);
  const edges = edgeList(graph);
  const shuffled = shuffle(edges, rng);
  const desiredCount = Math.min(maxIncidents, Math.max(1, Math.floor(edges.length * intensity * 0.18)));

  const incidents = [];

  for (const edge of shuffled.slice(0, desiredCount)) {
    const severityRoll = rng();
    const multiplier = severityRoll > 0.92
      ? 2.8
      : Number((1.1 + rng() * 0.95).toFixed(2));

    incidents.push({
      from: edge.from,
      to: edge.to,
      multiplier,
      reason: severityRoll > 0.92 ? "lane_closure" : "heavy_traffic",
      tick
    });
  }

  return incidents;
}

export function summarizeIncidents(incidents = []) {
  const severeCount = incidents.filter((row) => row.multiplier >= 2).length;
  const averageMultiplier = incidents.length === 0
    ? 1
    : Number((incidents.reduce((sum, row) => sum + row.multiplier, 0) / incidents.length).toFixed(2));

  return {
    count: incidents.length,
    severeCount,
    averageMultiplier
  };
}
