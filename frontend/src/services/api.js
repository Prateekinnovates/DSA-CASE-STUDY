const API_BASE = "/api";

export async function fetchGraph() {
  const res = await fetch(`${API_BASE}/graph`);
  if (!res.ok) throw new Error("Failed to fetch graph from server");
  return res.json();
}

export async function resetGraphOnServer() {
  const res = await fetch(`${API_BASE}/graph/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset graph");
  return res.json();
}

export async function saveGraphOnServer(graphData) {
  const res = await fetch(`${API_BASE}/graph`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(graphData)
  });
  if (!res.ok) throw new Error("Failed to update graph on server");
  return res.json();
}

export async function computeShortestPath({
  source,
  destination,
  algorithm = "dijkstra",
  graph = null,
  include_steps = true
}) {
  const res = await fetch(`${API_BASE}/shortest-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      destination,
      algorithm,
      graph,
      include_steps
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Shortest path computation failed");
  }
  return res.json();
}

export async function findNearestFacility({
  incident_node_id,
  facility_type,
  algorithm = "dijkstra",
  graph = null
}) {
  const res = await fetch(`${API_BASE}/nearest-facility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incident_node_id,
      facility_type,
      algorithm,
      graph
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Nearest facility dispatch failed");
  }
  return res.json();
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
  const res = await fetch(`${API_BASE}/block-road`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      edge_id,
      status,
      traffic_multiplier,
      recompute,
      active_source,
      active_destination,
      algorithm,
      graph
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update road status");
  }
  return res.json();
}

export async function compareAlgorithms({
  source,
  destination,
  graph = null
}) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      destination,
      graph
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Algorithm comparison failed");
  }
  return res.json();
}

