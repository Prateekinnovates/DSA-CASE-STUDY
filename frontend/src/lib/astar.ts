/**
 * A* Search Algorithm implemented manually from scratch in TypeScript using MinHeap.
 * Uses an admissible and consistent Haversine straight-line heuristic.
 */

import { CityGraph } from "./graph";
import { MinHeap } from "./priorityQueue";
import { PathResponse, PathStep } from "./types";

export function runAStar(
  graph: CityGraph,
  source: string,
  destination: string,
  includeSteps: boolean = true
): PathResponse {
  const startTime = performance.now();

  const timeComplexity = "O(E) best, O(V log V) average";
  const spaceComplexity = "O(V + E)";

  if (!graph.nodes.has(source)) {
    return {
      algorithm: "astar",
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
      algorithm: "astar",
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
      algorithm: "astar",
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

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const predecessors: Record<
    string,
    { prevNode: string; edgeId: string; distKm: number } | null
  > = {};

  for (const node of graph.nodes.values()) {
    gScore[node.id] = Infinity;
    fScore[node.id] = Infinity;
    predecessors[node.id] = null;
  }

  gScore[source] = 0;
  const initialH = graph.heuristic(source, destination);
  fScore[source] = initialH;

  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(source, fScore[source]);

  let nodesVisitedCount = 0;
  let edgesRelaxedCount = 0;

  const getFiniteDistances = () => {
    const res: Record<string, number> = {};
    for (const [k, v] of Object.entries(gScore)) {
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
      message: `Initialized A* at source '${graph.nodes.get(source)?.name}'. h(source, dest) = ${initialH.toFixed(2)} mins.`,
    });
  }

  let destinationReached = false;

  while (!pq.isEmpty()) {
    const [currNode, currF] = pq.pop();

    if (visited.has(currNode)) {
      continue;
    }

    visited.add(currNode);
    nodesVisitedCount += 1;
    const currG = gScore[currNode];
    const currH = graph.heuristic(currNode, destination);

    if (includeSteps) {
      stepNum += 1;
      steps.push({
        step_num: stepNum,
        action: "visit_node",
        current_node: currNode,
        visited_nodes: Array.from(visited),
        frontier: pq.toList(),
        distances: getFiniteDistances(),
        message: `Examining node '${graph.nodes.get(currNode)?.name}' (${currNode}) [g=${currG.toFixed(2)}, h=${currH.toFixed(2)}, f=${currF.toFixed(2)}].`,
      });
    }

    if (currNode === destination) {
      destinationReached = true;
      break;
    }

    for (const { target: neighborId, edge } of graph.getNeighbors(currNode)) {
      if (visited.has(neighborId)) continue;

      const weight = graph.getEdgeWeight(edge);
      if (weight === Infinity) continue;

      const tentativeG = currG + weight;

      if (tentativeG < gScore[neighborId]) {
        edgesRelaxedCount += 1;
        const oldG = gScore[neighborId];
        gScore[neighborId] = tentativeG;
        const hVal = graph.heuristic(neighborId, destination);
        const newF = tentativeG + hVal;
        fScore[neighborId] = newF;
        predecessors[neighborId] = {
          prevNode: currNode,
          edgeId: edge.id,
          distKm: edge.distance_km,
        };
        pq.push(neighborId, newF);

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
              old_g: oldG < Infinity ? Number(oldG.toFixed(2)) : "inf",
              new_g: Number(tentativeG.toFixed(2)),
              h: Number(hVal.toFixed(2)),
              f: Number(newF.toFixed(2)),
            },
            message: `A* relaxed edge ${currNode} ➔ ${neighborId}: g=${tentativeG.toFixed(2)}, h=${hVal.toFixed(2)}, f=${newF.toFixed(2)}.`,
          });
        }
      }
    }
  }

  const execMs = performance.now() - startTime;

  if (!destinationReached && gScore[destination] === Infinity) {
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
      algorithm: "astar",
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
  const totalTimeMin = gScore[destination];

  if (includeSteps) {
    stepNum += 1;
    steps.push({
      step_num: stepNum,
      action: "complete",
      current_node: destination,
      visited_nodes: Array.from(visited),
      frontier: [],
      distances: getFiniteDistances(),
      message: `A* optimal path found! Explored ${nodesVisitedCount} nodes vs total ${graph.nodes.size}.`,
    });
  }

  return {
    algorithm: "astar",
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

