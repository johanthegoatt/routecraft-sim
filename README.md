# RouteCraft Sim

## Description
RouteCraft Sim is a routing simulation engine with weighted graph planning, alternative-path generation, and deterministic traffic-aware mission simulation.

## Features
- Dual pathfinding engines: A* and Dijkstra
- Directed traffic incident model with seeded deterministic generation
- Alternative route generation via edge-penalty diversification
- Multi-stop mission simulation with reroute logic and reliability scoring
- Optimal stop ordering: exact Held-Karp DP up to 12 stops, 2-opt past that, reported next to the nearest-neighbour cost it replaced
- CLI commands for network introspection, route planning, and mission simulation

## Run
```bash
cd routecraft-sim
npm start -- help
npm start -- network
npm start -- plan --start hub --end depot --mode astar --seed 12 --intensity 0.5 --alternatives 4
npm start -- simulate --start hub --stops north,market,depot --mode astar --seed 21 --intensity 0.55 --service 2
npm start -- multistop --start hub --stops north,market,depot
npm start -- compare --start hub --end depot --seed 12 --intensity 0.5
```

## Your own map

Every command takes `--network <file.json>`: nodes with `x`/`y` positions and directed edges with a cost in minutes. One-way streets are just edges with no way back.

```bash
npm start -- plan --network examples/one-way-loop.json --start dock --end mill
```

## Test
```bash
cd routecraft-sim
npm test
```

## Project Structure
```text
routecraft-sim/
  src/
    cli.js
    router.js
    engine/
      alternatives.js
      graph.js
      mission.js
      pathfinding.js
      traffic.js
    lib/
      priorityQueue.js
      random.js
    scenarios/
      defaultNetwork.js
  tests/
    alternatives.test.js
    mission.test.js
    pathfinding.test.js
    router.test.js
    traffic.test.js
  package.json
  README.md
```
