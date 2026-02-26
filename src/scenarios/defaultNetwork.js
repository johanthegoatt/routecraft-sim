export const defaultNetwork = {
  nodes: {
    hub: { x: 0, y: 0 },
    north: { x: 0, y: 6 },
    east: { x: 7, y: 2 },
    west: { x: -6, y: 2 },
    south: { x: 1, y: -6 },
    depot: { x: 8, y: -5 },
    market: { x: 4, y: 7 },
    terminal: { x: -4, y: -5 }
  },
  edges: {
    hub: { north: 4, east: 6, west: 5, market: 7 },
    north: { hub: 4, east: 3, market: 3 },
    east: { hub: 6, north: 3, south: 4, depot: 5, market: 4 },
    west: { hub: 5, south: 6, terminal: 5 },
    south: { west: 6, east: 4, depot: 3, terminal: 4 },
    depot: { east: 5, south: 3, terminal: 4 },
    market: { hub: 7, north: 3, east: 4 },
    terminal: { west: 5, south: 4, depot: 4 }
  }
};
