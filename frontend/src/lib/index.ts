/**
 * Route-O-Rescue Core Algorithms and Graph Data Structures (TypeScript).
 * Pure client-side implementation from scratch.
 */

export * from "./types";
export * from "./priorityQueue";
export * from "./graph";
export * from "./dijkstra";
export * from "./astar";
export * from "./bellmanFord";
export * from "./alternatePath";
export * from "./multiSource";

import { CityGraph } from "./graph";
import { runDijkstra } from "./dijkstra";
import { runAStar } from "./astar";
import { runBellmanFord } from "./bellmanFord";
import {
  AlgorithmType,
  BlockRoadResponse,
  CompareAlgorithmsResponse,
  GraphData,
  PathResponse,
  RoadStatus,
} from "./types";

/**
 * Compare Dijkstra, A*, and Bellman-Ford on the exact same graph and endpoints.
 */
export function compareAlgorithms(
  graph: CityGraph,
  source: string,
  destination: string
): CompareAlgorithmsResponse {
  const dijkstraRes = runDijkstra(graph, source, destination, false);
  const astarRes = runAStar(graph, source, destination, false);
  const bellmanRes = runBellmanFord(graph, source, destination, false);

  const times = [
    { name: "Dijkstra", val: dijkstraRes.execution_time_ms },
    { name: "A*", val: astarRes.execution_time_ms },
    { name: "Bellman-Ford", val: bellmanRes.execution_time_ms },
  ];
  times.sort((a, b) => a.val - b.val);

  const nodes = [
    { name: "Dijkstra", val: dijkstraRes.nodes_visited_count },
    { name: "A*", val: astarRes.nodes_visited_count },
    { name: "Bellman-Ford", val: bellmanRes.nodes_visited_count },
  ];
  nodes.sort((a, b) => a.val - b.val);

  const costMatch =
    dijkstraRes.found &&
    Math.abs(dijkstraRes.total_cost - astarRes.total_cost) < 1e-4 &&
    Math.abs(dijkstraRes.total_cost - bellmanRes.total_cost) < 1e-4;

  return {
    source,
    destination,
    dijkstra: dijkstraRes,
    astar: astarRes,
    bellman_ford: bellmanRes,
    summary: {
      fastest_execution_algo: times[0].name,
      least_nodes_visited_algo: nodes[0].name,
      cost_match: costMatch,
    },
  };
}

/**
 * Toggle edge blockage or update traffic multiplier and optionally recompute route.
 */
export function blockRoadAndReroute({
  graph,
  edgeId,
  status,
  trafficMultiplier,
  recompute,
  activeSource,
  activeDestination,
  algorithm = "dijkstra",
}: {
  graph: CityGraph;
  edgeId: string;
  status: RoadStatus;
  trafficMultiplier?: number | null;
  recompute?: boolean;
  activeSource?: string | null;
  activeDestination?: string | null;
  algorithm?: AlgorithmType;
}): BlockRoadResponse {
  const edge = graph.updateEdgeStatus(edgeId, status, trafficMultiplier);
  if (!edge) {
    throw new Error(`Edge '${edgeId}' not found in graph.`);
  }

  let recomputedPath: PathResponse | null = null;
  if (recompute && activeSource && activeDestination) {
    if (algorithm === "astar") {
      recomputedPath = runAStar(graph, activeSource, activeDestination, true);
    } else if (algorithm === "bellman_ford") {
      recomputedPath = runBellmanFord(graph, activeSource, activeDestination, true);
    } else {
      recomputedPath = runDijkstra(graph, activeSource, activeDestination, true);
    }
  }

  const actionText = status === "blocked" ? "blocked" : "unblocked (open)";
  return {
    edge,
    graph: graph.toGraphData(),
    recomputed_path: recomputedPath,
    message: `Road ${edge.source} ➔ ${edge.target} (${edge.id}) is now ${actionText}.`,
  };
}

