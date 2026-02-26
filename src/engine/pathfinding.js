import { createPriorityQueue } from "../lib/priorityQueue.js";
import { edgeCostWithModifiers, getNeighbors } from "./graph.js";

function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    path.unshift(current);
  }
  return path;
}

function validateNode(graph, nodeId) {
  if (!graph.nodes[nodeId]) {
    throw new Error(`Unknown node: ${nodeId}`);
  }
}

function distanceBetween(nodeA, nodeB) {
  if (!nodeA || !nodeB) return 0;
  return Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
}

export function dijkstra(graph, start, end, options = {}) {
  validateNode(graph, start);
  validateNode(graph, end);

  const queue = createPriorityQueue((left, right) => left.score - right.score);
  const distances = new Map();
  const cameFrom = new Map();
  const visited = new Set();

  for (const nodeId of Object.keys(graph.nodes)) {
    distances.set(nodeId, Number.POSITIVE_INFINITY);
  }

  distances.set(start, 0);
  queue.push({ node: start, score: 0 });

  while (queue.size() > 0) {
    const next = queue.pop();
    const current = next.node;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === end) {
      const path = reconstructPath(cameFrom, current);
      return {
        algorithm: "dijkstra",
        distance: Number(distances.get(end).toFixed(4)),
        path,
        visitedCount: visited.size
      };
    }

    const neighbors = getNeighbors(graph, current);
    for (const neighbor of Object.keys(neighbors)) {
      const edgeCost = edgeCostWithModifiers(graph, current, neighbor, options);
      const candidate = distances.get(current) + edgeCost;

      if (candidate < distances.get(neighbor)) {
        distances.set(neighbor, candidate);
        cameFrom.set(neighbor, current);
        queue.push({ node: neighbor, score: candidate });
      }
    }
  }

  return {
    algorithm: "dijkstra",
    distance: Number.POSITIVE_INFINITY,
    path: [],
    visitedCount: visited.size
  };
}

export function aStar(graph, start, end, options = {}) {
  validateNode(graph, start);
  validateNode(graph, end);

  const queue = createPriorityQueue((left, right) => left.priority - right.priority);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const visited = new Set();

  for (const nodeId of Object.keys(graph.nodes)) {
    gScore.set(nodeId, Number.POSITIVE_INFINITY);
    fScore.set(nodeId, Number.POSITIVE_INFINITY);
  }

  gScore.set(start, 0);
  fScore.set(start, distanceBetween(graph.nodes[start], graph.nodes[end]));
  queue.push({ node: start, priority: fScore.get(start) });

  while (queue.size() > 0) {
    const current = queue.pop().node;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === end) {
      const path = reconstructPath(cameFrom, current);
      return {
        algorithm: "astar",
        distance: Number(gScore.get(end).toFixed(4)),
        path,
        visitedCount: visited.size
      };
    }

    const neighbors = getNeighbors(graph, current);
    for (const neighbor of Object.keys(neighbors)) {
      const tentativeScore = gScore.get(current) + edgeCostWithModifiers(graph, current, neighbor, options);

      if (tentativeScore < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeScore);
        const heuristic = distanceBetween(graph.nodes[neighbor], graph.nodes[end]);
        const priority = tentativeScore + heuristic;
        fScore.set(neighbor, priority);
        queue.push({ node: neighbor, priority });
      }
    }
  }

  return {
    algorithm: "astar",
    distance: Number.POSITIVE_INFINITY,
    path: [],
    visitedCount: visited.size
  };
}
