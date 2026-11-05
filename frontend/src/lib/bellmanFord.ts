/**
 * Bellman-Ford Algorithm implemented manually from scratch in TypeScript.
 * Handles dynamic edge weights and negative cycle verification.
 */

import { CityGraph } from "./graph";
import { PathResponse, PathStep } from "./types";

export function runBellmanFord(
  graph: CityGraph,
  source: string,
  destination: string,
  includeSteps: boolean = true
): PathResponse {
  const startTime = performance.now();

  const timeComplexity = "O(V * E)";
  const spaceComplexity = "O(V)";

  if (!graph.nodes.has(source)) {
    return {
      algorithm: "bellman_ford",
      found: false,
      source,
      destination,
      path: [],
      path_nodes: [],
      total_distance_km: 0,
      estimated_time_minutes: 0,
      total_cost: 0,
      nodes_visited_count: 0,
      edges_relaxed_count: 0,
      execution_time_ms: 0,
      steps: [],
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      error_message: `Source node '${source}' does not exist in graph.`,
    };
  }

  if (!graph.nodes.has(destination)) {
    return {
      algorithm: "bellman_ford",
      found: false,
      source,
      destination,
      path: [],
      path_nodes: [],
      total_distance_km: 0,
      estimated_time_minutes: 0,
      total_cost: 0,
      nodes_visited_count: 0,
      edges_relaxed_count: 0,
      execution_time_ms: 0,
      steps: [],
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      error_message: `Destination node '${destination}' does not exist in graph.`,
    };
  }

  const steps: PathStep[] = [];
  let stepNum = 0;

  if (source === destination) {
    const nodeObj = graph.nodes.get(source)!;
    const execMs = performance.now() - startTime;
    if (includeSteps) {
      steps.push({
        step_num: 1,
        action: "complete",
        current_node: source,
        visited_nodes: [source],
        frontier: [],
        distances: { [source]: 0 },
        message: `Source and destination are identical (${source}). Path length is 0.`,
      });
    }
    return {
      algorithm: "bellman_ford",
      found: true,
      source,
      destination,
      path: [source],
      path_nodes: [nodeObj],
      total_distance_km: 0,
      estimated_time_minutes: 0,
      total_cost: 0,
      nodes_visited_count: 1,
      edges_relaxed_count: 0,
      execution_time_ms: Number(execMs.toFixed(3)),
      steps,
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
    };
  }

  const distances: Record<string, number> = {};
  const predecessors: Record<
    string,
    { prevNode: string; edgeId: string; distKm: number } | null
  > = {};

  for (const node of graph.nodes.values()) {
    distances[node.id] = Infinity;
    predecessors[node.id] = null;
  }
  distances[source] = 0;

  // Flatten active directed edge instances from adjacency list
  const allEdges: Array<{
    u: string;
    v: string;
    weight: number;
    distKm: number;
    edgeId: string;
  }> = [];

  for (const [u, neighbors] of graph.adj.entries()) {
    for (const { target: v, edge } of neighbors) {
      const w = graph.getEdgeWeight(edge);
      if (w < Infinity) {
        allEdges.push({
          u,
          v,
          weight: w,
          distKm: edge.distance_km,
          edgeId: edge.id,
        });
      }
    }
  }

  const numVertices = graph.nodes.size;
  let edgesRelaxedCount = 0;
  const visitedNodes = new Set<string>([source]);

  const getFiniteDistances = () => {
    const res: Record<string, number> = {};
    for (const [k, v] of Object.entries(distances)) {
      if (v < Infinity) res[k] = Number(v.toFixed(2));
    }
    return res;
  };

  if (includeSteps) {
    stepNum += 1;
    steps.push({
      step_num: stepNum,
      action: "init",
      current_node: source,
      visited_nodes: Array.from(visitedNodes),
      frontier: [],
      distances: getFiniteDistances(),
      message: `Initialized Bellman-Ford at '${source}'. Starting up to ${numVertices - 1} iteration passes.`,
    });
  }

  // Relax edges up to V - 1 times
  for (let iteration = 1; iteration < numVertices; iteration++) {
    let updated = false;
    let iterationRelaxations = 0;

    for (const { u, v, weight, distKm, edgeId } of allEdges) {
      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        const oldDist = distances[v];
        const newDist = distances[u] + weight;
        distances[v] = newDist;
        predecessors[v] = { prevNode: u, edgeId, distKm };
        visitedNodes.add(u);
        visitedNodes.add(v);
        edgesRelaxedCount += 1;
        iterationRelaxations += 1;
        updated = true;

        if (includeSteps && iterationRelaxations <= 4) {
          stepNum += 1;
          steps.push({
            step_num: stepNum,
            action: "relax_edge",
            current_node: u,
            visited_nodes: Array.from(visitedNodes),
            frontier: [],
            distances: getFiniteDistances(),
            edge_relaxed: {
              edge_id: edgeId,
              source: u,
              target: v,
              weight: Number(weight.toFixed(2)),
              old_dist: oldDist < Infinity ? Number(oldDist.toFixed(2)) : "inf",
              new_dist: Number(newDist.toFixed(2)),
              round: iteration,
            },
            message: `Pass ${iteration}: relaxed ${u} ➔ ${v} (new cost: ${newDist.toFixed(2)} mins).`,
          });
        }
      }
    }

    if (includeSteps && iterationRelaxations > 0) {
      stepNum += 1;
      steps.push({
        step_num: stepNum,
        action: "pass_complete",
        current_node: null,
        visited_nodes: Array.from(visitedNodes),
        frontier: [],
        distances: getFiniteDistances(),
        message: `Iteration pass ${iteration}/${numVertices - 1} complete. ${iterationRelaxations} edges relaxed.`,
      });
    }

    // Early termination if converged
    if (!updated) {
      if (includeSteps) {
        stepNum += 1;
        steps.push({
          step_num: stepNum,
          action: "converged",
          current_node: null,
          visited_nodes: Array.from(visitedNodes),
          frontier: [],
          distances: getFiniteDistances(),
          message: `Bellman-Ford converged early at pass ${iteration} (no distances improved).`,
        });
      }
      break;
    }
  }

  // Check for negative weight cycles
  let hasNegativeCycle = false;
  for (const { u, v, weight } of allEdges) {
    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      hasNegativeCycle = true;
      break;
    }
  }

  const execMs = performance.now() - startTime;

  if (hasNegativeCycle) {
    return {
      algorithm: "bellman_ford",
      found: false,
      source,
      destination,
      path: [],
      path_nodes: [],
      total_distance_km: 0,
      estimated_time_minutes: 0,
      total_cost: 0,
      nodes_visited_count: visitedNodes.size,
      edges_relaxed_count: edgesRelaxedCount,
      execution_time_ms: Number(execMs.toFixed(3)),
      steps,
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      error_message: "Negative weight cycle detected in the road network.",
    };
  }

  if (distances[destination] === Infinity) {
    if (includeSteps) {
      stepNum += 1;
      steps.push({
        step_num: stepNum,
        action: "no_path",
        current_node: null,
        visited_nodes: Array.from(visitedNodes),
        frontier: [],
        distances: getFiniteDistances(),
        message: `No passable path exists between '${source}' and '${destination}'.`,
      });
    }
    return {
      algorithm: "bellman_ford",
      found: false,
      source,
      destination,
      path: [],
      path_nodes: [],
      total_distance_km: 0,
      estimated_time_minutes: 0,
      total_cost: 0,
      nodes_visited_count: visitedNodes.size,
      edges_relaxed_count: edgesRelaxedCount,
      execution_time_ms: Number(execMs.toFixed(3)),
      steps,
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      error_message: "No accessible path found between the specified locations.",
    };
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = destination;
  let totalDistanceKm = 0;

  while (curr !== null) {
    path.push(curr);
    const predInfo = predecessors[curr];
    if (predInfo) {
      totalDistanceKm += predInfo.distKm;
      curr = predInfo.prevNode;
    } else {
      curr = null;
    }
  }

  path.reverse();
  const pathNodes = path
    .map((nid) => graph.nodes.get(nid)!)
    .filter(Boolean);
  const totalTimeMin = distances[destination];

  if (includeSteps) {
    stepNum += 1;
    steps.push({
      step_num: stepNum,
      action: "complete",
      current_node: destination,
      visited_nodes: Array.from(visitedNodes),
      frontier: [],
      distances: getFiniteDistances(),
      message: `Bellman-Ford path computed. Distance: ${totalDistanceKm.toFixed(2)} km, Time: ${totalTimeMin.toFixed(2)} mins.`,
    });
  }

  return {
    algorithm: "bellman_ford",
    found: true,
    source,
    destination,
    path,
    path_nodes: pathNodes,
    total_distance_km: Number(totalDistanceKm.toFixed(2)),
    estimated_time_minutes: Number(totalTimeMin.toFixed(2)),
    total_cost: Number(totalTimeMin.toFixed(2)),
    nodes_visited_count: visitedNodes.size,
    edges_relaxed_count: edgesRelaxedCount,
    execution_time_ms: Number(execMs.toFixed(3)),
    steps,
    time_complexity: timeComplexity,
    space_complexity: spaceComplexity,
  };
}

