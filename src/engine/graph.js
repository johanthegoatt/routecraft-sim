function cloneEdges(edges) {
  const clone = {};
  for (const [from, neighbors] of Object.entries(edges)) {
    clone[from] = { ...neighbors };
  }
  return clone;
}

function cloneNodes(nodes) {
  const clone = {};
  for (const [id, node] of Object.entries(nodes)) {
    clone[id] = { ...node };
  }
  return clone;
}

export function createGraph(network) {
  if (!network || typeof network !== "object") {
    throw new Error("Network must be an object.");
  }

  const nodes = cloneNodes(network.nodes || {});
  const edges = cloneEdges(network.edges || {});

  const nodeKeys = Object.keys(nodes);
  if (nodeKeys.length === 0) {
    throw new Error("Network must include nodes.");
  }

  for (const [from, neighbors] of Object.entries(edges)) {
    if (!nodes[from]) {
      throw new Error(`Edge source is missing node: ${from}`);
    }

    for (const [to, cost] of Object.entries(neighbors)) {
      if (!nodes[to]) {
        throw new Error(`Edge target is missing node: ${to}`);
      }
      if (!Number.isFinite(cost) || cost <= 0) {
        throw new Error(`Edge cost must be > 0 for ${from} -> ${to}`);
      }
    }
  }

  return {
    nodes,
    edges
  };
}

export function edgeKey(from, to) {
  return `${from}::${to}`;
}

export function getNeighbors(graph, nodeId) {
  return graph.edges[nodeId] || {};
}

export function edgeBaseCost(graph, from, to) {
  const value = graph.edges[from]?.[to];
  if (!Number.isFinite(value)) {
    throw new Error(`Missing edge ${from} -> ${to}`);
  }
  return value;
}

export function edgeCostWithModifiers(graph, from, to, modifiers = {}) {
  const base = edgeBaseCost(graph, from, to);
  const key = edgeKey(from, to);
  const trafficMultiplier = Number(modifiers.trafficMap?.[key] ?? 1);
  const edgePenalty = Number(modifiers.penalties?.[key] ?? 0);
  return base * trafficMultiplier + edgePenalty;
}

export function edgeList(graph) {
  const rows = [];
  for (const [from, neighbors] of Object.entries(graph.edges)) {
    for (const [to, baseCost] of Object.entries(neighbors)) {
      rows.push({ from, to, baseCost });
    }
  }
  return rows;
}

export function routeCost(graph, path, modifiers = {}) {
  if (!Array.isArray(path) || path.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    total += edgeCostWithModifiers(graph, path[i], path[i + 1], modifiers);
  }
  return Number(total.toFixed(4));
}
