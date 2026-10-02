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

// Ordering stops is an open travelling-salesman path: the start is fixed and
// the route does not return. Greedy nearest-neighbour, which this used to be,
// can be a factor of O(log n) worse than optimal (Rosenkrantz, Stearns and
// Lewis, 1977). Up to EXACT_LIMIT stops the order is solved exactly with the
// Held-Karp dynamic programme (1962), O(n^2 * 2^n) over a matrix of shortest
// path costs. Past that, the greedy order is improved with 2-opt segment
// reversals (Croes, 1958) until no reversal shortens it. Candidates are
// compared as whole-route sums, so one-way streets with asymmetric costs
// stay correct.
export const EXACT_LIMIT = 12;

function costMatrix(graph, points) {
  return points.map((from) =>
    points.map((to) => (from === to ? { distance: 0, path: [from] } : dijkstraEngine(graph, from, to)))
  );
}

function orderCost(matrix, order) {
  let total = 0;
  let previous = 0;
  for (const index of order) {
    total += matrix[previous][index].distance;
    previous = index;
  }
  return total;
}

function greedyOrder(matrix, count) {
  const order = [];
  const remaining = new Set(Array.from({ length: count }, (_, index) => index + 1));
  let cursor = 0;
  while (remaining.size > 0) {
    let best = null;
    for (const index of remaining) {
      if (best === null || matrix[cursor][index].distance < matrix[cursor][best].distance) best = index;
    }
    order.push(best);
    remaining.delete(best);
    cursor = best;
  }
  return order;
}

function heldKarp(matrix, count) {
  const full = (1 << count) - 1;
  const cost = Array.from({ length: 1 << count }, () => new Array(count).fill(Number.POSITIVE_INFINITY));
  const parent = Array.from({ length: 1 << count }, () => new Array(count).fill(-1));

  for (let last = 0; last < count; last += 1) cost[1 << last][last] = matrix[0][last + 1].distance;

  for (let mask = 1; mask <= full; mask += 1) {
    for (let last = 0; last < count; last += 1) {
      const here = cost[mask][last];
      if (!(mask & (1 << last)) || !Number.isFinite(here)) continue;
      for (let next = 0; next < count; next += 1) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const candidate = here + matrix[last + 1][next + 1].distance;
        if (candidate < cost[nextMask][next]) {
          cost[nextMask][next] = candidate;
          parent[nextMask][next] = last;
        }
      }
    }
  }

  let last = 0;
  for (let index = 1; index < count; index += 1) {
    if (cost[full][index] < cost[full][last]) last = index;
  }
  const order = [];
  let mask = full;
  while (last !== -1) {
    order.unshift(last + 1);
    const previous = parent[mask][last];
    mask &= ~(1 << last);
    last = previous;
  }
  return order;
}

function twoOpt(matrix, order) {
  let best = order.slice();
  let bestCost = orderCost(matrix, best);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const candidate = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        const candidateCost = orderCost(matrix, candidate);
        if (candidateCost < bestCost - 1e-9) {
          best = candidate;
          bestCost = candidateCost;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function planMultiStopRoute(graphAdjacency, start, stops) {
  const graph = fromAdjacency(graphAdjacency);
  const unique = [...new Set(stops)].filter((stop) => stop !== start);
  const points = [start, ...unique];
  const matrix = costMatrix(graph, points);

  const reachable = unique.filter((_, index) => Number.isFinite(matrix[0][index + 1].distance));
  const unresolvedStops = unique.filter((stop) => !reachable.includes(stop));
  const keep = [0, ...reachable.map((stop) => points.indexOf(stop))];
  const sub = keep.map((row) => keep.map((column) => matrix[row][column]));
  const count = reachable.length;

  const greedy = greedyOrder(sub, count);
  const method = count <= EXACT_LIMIT ? "held-karp" : "2-opt";
  let order = count === 0 ? [] : method === "held-karp" ? heldKarp(sub, count) : twoOpt(sub, greedy);
  // On a one-way network every complete order can be infinite. Greedy then
  // still gets as far as it can, which is what callers saw before.
  if (!Number.isFinite(orderCost(sub, order))) order = greedy;

  const orderedStops = [];
  const segmentPaths = [];
  const fullPath = [start];
  let totalDistance = 0;
  let previous = 0;
  for (const [position, index] of order.entries()) {
    const segment = sub[previous][index];
    if (!Number.isFinite(segment.distance)) {
      unresolvedStops.push(...order.slice(position).map((i) => reachable[i - 1]));
      break;
    }
    orderedStops.push(reachable[index - 1]);
    segmentPaths.push(segment.path);
    fullPath.push(...segment.path.slice(1));
    totalDistance += segment.distance;
    previous = index;
  }

  return {
    orderedStops,
    segmentPaths,
    fullPath,
    unresolvedStops: unresolvedStops.sort(),
    totalDistance: Number(totalDistance.toFixed(4)),
    method,
    greedyDistance: Number(orderCost(sub, greedy).toFixed(4))
  };
}
