/**
 * Second-shortest path (Backup route) implementation for emergency resilience.
 * Uses Yen's edge-deviation method with scratch Dijkstra.
 */

import { CityGraph } from "./graph";
import { PathResponse } from "./types";
import { runDijkstra } from "./dijkstra";

export function findAlternatePath(
  graph: CityGraph,
  source: string,
  destination: string,
  primaryPath: PathResponse
): PathResponse | null {
  if (!primaryPath.found || primaryPath.path.length < 2) {
    return null;
  }

  let bestAlternate: PathResponse | null = null;
  let bestCost = Infinity;

  for (let i = 0; i < primaryPath.path.length - 1; i++) {
    const u = primaryPath.path[i];
    const v = primaryPath.path[i + 1];

    const connecting = graph
      .getNeighbors(u)
      .filter((n) => n.target === v)
      .map((n) => n.edge);

    if (connecting.length === 0) continue;

    const targetEdge = connecting[0];
    const originalStatus = targetEdge.status;

    targetEdge.status = "blocked";

    try {
      const candidate = runDijkstra(graph, source, destination, false);

      if (
        candidate.found &&
        JSON.stringify(candidate.path) !== JSON.stringify(primaryPath.path)
      ) {
        if (candidate.total_cost < bestCost) {
          bestCost = candidate.total_cost;
          bestAlternate = candidate;
        }
      }
    } finally {
      targetEdge.status = originalStatus;
    }
  }

  if (bestAlternate) {
    bestAlternate.algorithm = `${bestAlternate.algorithm} (Backup Route)`;
  }

  return bestAlternate;
}

