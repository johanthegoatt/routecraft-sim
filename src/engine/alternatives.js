import { edgeKey } from "./graph.js";
import { dijkstra } from "./pathfinding.js";

function routeId(path) {
  return path.join("->");
}

function applyPathPenalty(path, penaltyMap, amount) {
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = edgeKey(path[i], path[i + 1]);
    penaltyMap[key] = Number(((penaltyMap[key] || 0) + amount).toFixed(4));
  }
}

export function findAlternativeRoutes(graph, start, end, options = {}) {
  const count = Math.max(1, Math.min(8, Number(options.count) || 3));
  const basePenalty = Number(options.basePenalty || 1.75);
  const penalties = { ...(options.penalties || {}) };
  const routes = [];
  const seen = new Set();

  for (let i = 0; i < count; i += 1) {
    const result = dijkstra(graph, start, end, {
      trafficMap: options.trafficMap,
      penalties
    });

    if (!result.path.length || !Number.isFinite(result.distance)) {
      break;
    }

    const id = routeId(result.path);
    if (!seen.has(id)) {
      seen.add(id);
      routes.push(result);
    }

    applyPathPenalty(result.path, penalties, basePenalty * (i + 1));
  }

  return routes.sort((left, right) => left.distance - right.distance);
}
