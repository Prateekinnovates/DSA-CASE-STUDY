/**
 * Dijkstra's Algorithm implemented manually from scratch in TypeScript using MinHeap.
 * No external graph or heap libraries used.
 */

import { CityGraph } from "./graph";
import { MinHeap } from "./priorityQueue";
import { PathResponse, PathStep } from "./types";

export function runDijkstra(
  graph: CityGraph,
  source: string,
  destination: string,
  includeSteps: boolean = true
): PathResponse {
  const startTime = performance.now();

  const timeComplexity = "O((V + E) log V)";
  const spaceComplexity = "O(V + E)";

  if (!graph.nodes.has(source)) {
    return {
      algorithm: "dijkstra",
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
      algorithm: "dijkstra",
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

  // Source equals destination edge case
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
      algorithm: "dijkstra",
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

  // Initialize data structures
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

  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(source, 0);

  let nodesVisitedCount = 0;
  let edgesRelaxedCount = 0;

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
      visited_nodes: [],
      frontier: pq.toList(),
      distances: getFiniteDistances(),
      message: `Initialized Dijkstra at source '${graph.nodes.get(source)?.name}' (${source}) with distance 0.0.`,
    });
  }

  let destinationReached = false;

  while (!pq.isEmpty()) {
    const [currNode, currDist] = pq.pop();

    if (visited.has(currNode)) {
      continue;
    }

    visited.add(currNode);
    nodesVisitedCount += 1;

    if (includeSteps) {
      stepNum += 1;
      steps.push({
        step_num: stepNum,
        action: "visit_node",
        current_node: currNode,
        visited_nodes: Array.from(visited),
        frontier: pq.toList(),
        distances: getFiniteDistances(),
        message: `Settled node '${graph.nodes.get(currNode)?.name}' (${currNode}) with minimum cost ${currDist.toFixed(2)} mins.`,
      });
    }

    if (currNode === destination) {
      destinationReached = true;
      break;
    }

    for (const { target: neighborId, edge } of graph.getNeighbors(currNode)) {
      if (visited.has(neighborId)) continue;

      const weight = graph.getEdgeWeight(edge);
      if (weight === Infinity) continue; // Road is blocked

      const newDist = currDist + weight;

      if (newDist < distances[neighborId]) {
        edgesRelaxedCount += 1;
        const oldDist = distances[neighborId];
        distances[neighborId] = newDist;
        predecessors[neighborId] = {
          prevNode: currNode,
          edgeId: edge.id,
          distKm: edge.distance_km,
        };
        pq.push(neighborId, newDist);

        if (includeSteps) {
          stepNum += 1;
          steps.push({
            step_num: stepNum,
            action: "relax_edge",
            current_node: currNode,
            visited_nodes: Array.from(visited),
            frontier: pq.toList(),
            distances: getFiniteDistances(),
            edge_relaxed: {
              edge_id: edge.id,
              source: currNode,
              target: neighborId,
              weight: Number(weight.toFixed(2)),
              old_dist: oldDist < Infinity ? Number(oldDist.toFixed(2)) : "inf",
              new_dist: Number(newDist.toFixed(2)),
            },
            message: `Relaxed road ${currNode} ➔ ${neighborId}: improved distance to ${newDist.toFixed(2)} mins.`,
          });
        }
      }
    }
  }

  const execMs = performance.now() - startTime;

  if (!destinationReached && distances[destination] === Infinity) {
    if (includeSteps) {
      stepNum += 1;
      steps.push({
        step_num: stepNum,
        action: "no_path",
        current_node: null,
        visited_nodes: Array.from(visited),
        frontier: [],
        distances: getFiniteDistances(),
        message: `No passable path exists between '${source}' and '${destination}' (roads blocked or graph disconnected).`,
      });
    }
    return {
      algorithm: "dijkstra",
      found: false,
      source,
      destination,
      path: [],
      path_nodes: [],
      total_distance_km: 0,
      estimated_time_minutes: 0,
      total_cost: 0,
      nodes_visited_count: nodesVisitedCount,
      edges_relaxed_count: edgesRelaxedCount,
      execution_time_ms: Number(execMs.toFixed(3)),
      steps,
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      error_message: "No accessible path found between the specified locations.",
    };
  }

  // Path reconstruction
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
      visited_nodes: Array.from(visited),
      frontier: [],
      distances: getFiniteDistances(),
      message: `Shortest path found! Distance: ${totalDistanceKm.toFixed(2)} km, Estimated time: ${totalTimeMin.toFixed(2)} mins.`,
    });
  }

  return {
    algorithm: "dijkstra",
    found: true,
    source,
    destination,
    path,
    path_nodes: pathNodes,
    total_distance_km: Number(totalDistanceKm.toFixed(2)),
    estimated_time_minutes: Number(totalTimeMin.toFixed(2)),
    total_cost: Number(totalTimeMin.toFixed(2)),
    nodes_visited_count: nodesVisitedCount,
    edges_relaxed_count: edgesRelaxedCount,
    execution_time_ms: Number(execMs.toFixed(3)),
    steps,
    time_complexity: timeComplexity,
    space_complexity: spaceComplexity,
  };
}

