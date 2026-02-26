import { createGraph, routeCost } from "./engine/graph.js";
import { dijkstra as dijkstraEngine } from "./engine/pathfinding.js";

function fromAdjacency(adjacency) {
  const nodes = {};
  const edges = {};

  const keys = Object.keys(adjacency);
  keys.forEach((nodeId, index) => {
    nodes[nodeId] = { x: index, y: 0 };
    edges[nodeId] = { ...(adjacency[nodeId] || {}) };
  });

  return createGraph({ nodes, edges });
}

export function dijkstra(graphAdjacency, start, end) {
  const graph = fromAdjacency(graphAdjacency);
  return dijkstraEngine(graph, start, end);
}

export function estimateRouteCost(graphAdjacency, path) {
  const graph = fromAdjacency(graphAdjacency);
  return routeCost(graph, path);
}

export function planMultiStopRoute(graphAdjacency, start, stops) {
  const graph = fromAdjacency(graphAdjacency);
  const orderedStops = [];
  const segmentPaths = [];
  const unresolvedStops = [];
  const fullPath = [start];
  let totalDistance = 0;
  let cursor = start;
  const remaining = new Set(stops);

  while (remaining.size > 0) {
    let best = null;

    for (const stop of remaining) {
      const result = dijkstraEngine(graph, cursor, stop);
      if (!best || result.distance < best.result.distance) {
        best = { stop, result };
      }
    }

    if (!best || !best.result.path.length || !Number.isFinite(best.result.distance)) {
      unresolvedStops.push(...Array.from(remaining.values()).sort());
      break;
    }

    orderedStops.push(best.stop);
    segmentPaths.push(best.result.path);
    for (let index = 1; index < best.result.path.length; index += 1) {
      fullPath.push(best.result.path[index]);
    }
    totalDistance += best.result.distance;
    remaining.delete(best.stop);
    cursor = best.stop;
  }

  return {
    orderedStops,
    segmentPaths,
    fullPath,
    unresolvedStops,
    totalDistance: Number(totalDistance.toFixed(4))
  };
}
