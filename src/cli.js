import { createGraph, edgeList } from "./engine/graph.js";
import { planRoute, simulateMission } from "./engine/mission.js";
import { generateTrafficIncidents } from "./engine/traffic.js";
import { planMultiStopRoute } from "./router.js";
import fs from "node:fs";
import { defaultNetwork } from "./scenarios/defaultNetwork.js";

// --network <file.json> swaps in your own map: { nodes: { id: { x, y } },
// edges: { from: { to: minutes } } }. createGraph checks it.
function loadNetwork(file) {
  if (!file || file === true) return defaultNetwork;
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`Can't read network file ${file}: ${error.code ?? error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Network file ${file} is not valid JSON: ${error.message}`);
  }
}

function parseArgs(rawArgs) {
  const result = { _: [] };
  let index = 0;

  while (index < rawArgs.length) {
    const token = rawArgs[index];
    if (!token.startsWith("--")) {
      result._.push(token);
      index += 1;
      continue;
    }

    const key = token.slice(2);
    const next = rawArgs[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      index += 1;
      continue;
    }

    result[key] = next;
    index += 2;
  }

  return result;
}

function printHelp() {
  console.log("RouteCraft Sim CLI");
  console.log("");
  console.log("Every command takes --network <file.json> to use your own map instead of the built-in one.");
  console.log("");
  console.log("Commands:");
  console.log("  network");
  console.log("  plan --start <node> --end <node> [--mode astar|dijkstra] [--seed 7] [--intensity 0.45] [--alternatives 3]");
  console.log("  simulate --start <node> --stops <a,b,c> [--mode astar|dijkstra] [--seed 7] [--intensity 0.45] [--service 2]");
  console.log("  multistop --start <node> --stops <a,b,c>");
  console.log("  compare --start <node> --end <node> [--seed 7] [--intensity 0.45]");
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function networkCommand(graph) {
  const edges = edgeList(graph);
  printJson({
    nodeCount: Object.keys(graph.nodes).length,
    edgeCount: edges.length,
    nodes: Object.keys(graph.nodes),
    sampleEdges: edges.slice(0, 10)
  });
}

function planCommand(graph, args) {
  const start = args.start || "hub";
  const end = args.end || "depot";
  const mode = args.mode || "astar";
  const seed = Number(args.seed || 7);
  const intensity = Number(args.intensity ?? 0.45);
  const alternativesCount = Number(args.alternatives || 3);

  const incidents = generateTrafficIncidents(graph, {
    seed,
    tick: 0,
    intensity,
    maxIncidents: 6
  });

  const report = planRoute(graph, {
    start,
    end,
    mode,
    incidents,
    alternativesCount
  });

  printJson(report);
}

function simulateCommand(graph, args) {
  const start = args.start || "hub";
  const stops = String(args.stops || "north,market,depot")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const report = simulateMission(graph, {
    start,
    stops,
    mode: args.mode || "astar",
    seed: Number(args.seed || 7),
    intensity: Number(args.intensity ?? 0.45),
    serviceMinutes: Number(args.service || 2)
  });

  printJson(report);
}

function multiStopCommand(network, args) {
  const start = args.start || "hub";
  const stops = String(args.stops || "north,market,depot")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const report = planMultiStopRoute(network.edges, start, stops);
  printJson({
    start,
    requestedStops: stops,
    ...report
  });
}

function compareCommand(graph, args) {
  const start = args.start || "hub";
  const end = args.end || "depot";
  const seed = Number(args.seed || 7);
  const intensity = Number(args.intensity ?? 0.45);
  const incidents = generateTrafficIncidents(graph, {
    seed,
    tick: 0,
    intensity,
    maxIncidents: 6
  });

  const astar = planRoute(graph, {
    start,
    end,
    mode: "astar",
    incidents,
    alternativesCount: 1
  }).primary;

  const dijkstra = planRoute(graph, {
    start,
    end,
    mode: "dijkstra",
    incidents,
    alternativesCount: 1
  }).primary;

  printJson({
    start,
    end,
    incidents,
    comparison: {
      astar,
      dijkstra,
      visitedDelta: dijkstra.visitedCount - astar.visitedCount,
      distanceDelta: Number((dijkstra.distance - astar.distance).toFixed(4))
    }
  });
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [command] = parsed._;

  if (!command || command === "help") {
    printHelp();
    return;
  }

  const network = loadNetwork(parsed.network);
  const graph = createGraph(network);

  if (command === "network") {
    networkCommand(graph);
    return;
  }

  if (command === "plan") {
    planCommand(graph, parsed);
    return;
  }

  if (command === "simulate") {
    simulateCommand(graph, parsed);
    return;
  }

  if (command === "multistop") {
    multiStopCommand(network, parsed);
    return;
  }

  if (command === "compare") {
    compareCommand(graph, parsed);
    return;
  }

  printHelp();
  process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
