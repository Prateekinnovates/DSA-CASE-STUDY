/**
 * In-memory client service replacing all HTTP/fetch calls with direct TypeScript module invocations.
 * Zero external network or backend dependencies.
 */

import {
  CityGraph,
  runDijkstra,
  runAStar,
  runBellmanFord,
  findNearestFacility as libFindNearestFacility,
  findAlternatePath as libFindAlternatePath,
  compareAlgorithms as libCompareAlgorithms,
  blockRoadAndReroute
} from "../lib";
import defaultSampleData from "../data/sample_city.json";

// In-memory global graph instance
let activeGraph = new CityGraph(defaultSampleData);

export async function fetchGraph() {
  return activeGraph.toGraphData();
}

export async function resetGraphOnServer() {
  activeGraph = new CityGraph(JSON.parse(JSON.stringify(defaultSampleData)));
  return activeGraph.toGraphData();
}

export async function saveGraphOnServer(graphData) {
  activeGraph = new CityGraph(graphData);
  return activeGraph.toGraphData();
}

export async function computeShortestPath({
  source,
  destination,
  algorithm = "dijkstra",
  graph = null,
  include_steps = true
}) {
  const g = graph ? new CityGraph(graph) : activeGraph;
  const algo = algorithm.toLowerCase();

  if (algo === "astar") {
    return runAStar(g, source, destination, include_steps);
  } else if (algo === "bellman_ford") {
    return runBellmanFord(g, source, destination, include_steps);
  } else {
    return runDijkstra(g, source, destination, include_steps);
  }
}

export async function findNearestFacility({
  incident_node_id,
  facility_type,
  algorithm = "dijkstra",
  graph = null
}) {
  const g = graph ? new CityGraph(graph) : activeGraph;
  return libFindNearestFacility(g, incident_node_id, facility_type, algorithm);
}

export async function toggleRoadBlockage({
  edge_id,
  status,
  traffic_multiplier = null,
  recompute = true,
  active_source = null,
  active_destination = null,
  algorithm = "dijkstra",
  graph = null
}) {
  const g = graph ? new CityGraph(graph) : activeGraph;
  const res = blockRoadAndReroute({
    graph: g,
    edgeId: edge_id,
    status,
    trafficMultiplier: traffic_multiplier,
    recompute,
    activeSource: active_source,
    activeDestination: active_destination,
    algorithm
  });

  if (!graph) {
    activeGraph = g;
  }

  return res;
}

export async function compareAlgorithms({
  source,
  destination,
  graph = null
}) {
  const g = graph ? new CityGraph(graph) : activeGraph;
  return libCompareAlgorithms(g, source, destination);
}

export async function findAlternatePath({
  source,
  destination,
  primary_path,
  graph = null
}) {
  const g = graph ? new CityGraph(graph) : activeGraph;
  return libFindAlternatePath(g, source, destination, primary_path);
}
