import { findAlternativeRoutes } from "./alternatives.js";
import { edgeKey } from "./graph.js";
import { aStar, dijkstra } from "./pathfinding.js";
import { buildTrafficMap, generateTrafficIncidents, summarizeIncidents } from "./traffic.js";

function solverForMode(mode) {
  return mode === "dijkstra" ? dijkstra : aStar;
}

function hasSevereSegment(path, trafficMap) {
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = edgeKey(path[i], path[i + 1]);
    if (Number(trafficMap[key] || 1) >= 2) {
      return true;
    }
  }
  return false;
}

function severePenalties(path, trafficMap) {
  const penalties = {};

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = edgeKey(path[i], path[i + 1]);
    if (Number(trafficMap[key] || 1) >= 2) {
      penalties[key] = 3.5;
    }
  }

  return penalties;
}

export function planRoute(graph, options = {}) {
  const start = options.start;
  const end = options.end;
  const mode = options.mode || "astar";
  const incidents = options.incidents || [];
  const alternativesCount = Math.max(1, Number(options.alternativesCount || 3));

  const trafficMap = buildTrafficMap(incidents);
  const solve = solverForMode(mode);

  const primary = solve(graph, start, end, { trafficMap });
  const alternatives = findAlternativeRoutes(graph, start, end, {
    count: alternativesCount,
    trafficMap
  });

  return {
    mode,
    start,
    end,
    traffic: summarizeIncidents(incidents),
    incidents,
    primary,
    alternatives
  };
}

export function simulateMission(graph, options = {}) {
  const start = options.start;
  const stops = Array.isArray(options.stops) ? options.stops : [];
  const mode = options.mode || "astar";
  const seed = Number(options.seed || 7);
  const serviceMinutes = Number(options.serviceMinutes || 2);
  const intensity = Number(options.intensity ?? 0.45);

  const solve = solverForMode(mode);
  const legs = [];
  let cursor = start;
  let totalMinutes = 0;

  for (let tick = 0; tick < stops.length; tick += 1) {
    const stop = stops[tick];
    const incidents = generateTrafficIncidents(graph, {
      seed,
      tick,
      intensity,
      maxIncidents: 5
    });

    const trafficMap = buildTrafficMap(incidents);
    let route = solve(graph, cursor, stop, { trafficMap });
    let rerouted = false;

    if (route.path.length > 1 && hasSevereSegment(route.path, trafficMap)) {
      const penalties = severePenalties(route.path, trafficMap);
      const alternative = solve(graph, cursor, stop, { trafficMap, penalties });

      if (Number.isFinite(alternative.distance) && alternative.distance <= route.distance + 2.5) {
        route = alternative;
        rerouted = true;
      }
    }

    const driveMinutes = Number(route.distance.toFixed(2));
    const traffic = summarizeIncidents(incidents);
    totalMinutes += driveMinutes + serviceMinutes;

    legs.push({
      legIndex: tick + 1,
      from: cursor,
      to: stop,
      route,
      traffic,
      incidents,
      rerouted,
      legTotalMinutes: Number((driveMinutes + serviceMinutes).toFixed(2))
    });

    cursor = stop;
  }

  const reliability = Math.max(
    35,
    Math.round(
      100 -
      legs.reduce((sum, leg) => sum + leg.traffic.severeCount * 7 + (leg.rerouted ? 4 : 0), 0)
    )
  );

  return {
    missionStart: start,
    missionStops: stops,
    mode,
    legs,
    totalEstimatedMinutes: Number(totalMinutes.toFixed(2)),
    reliability
  };
}
