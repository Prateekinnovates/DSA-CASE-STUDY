"""
Route-O-Rescue: FastAPI Backend Server
Shortest Path Planning & Dispatching for Emergency Services
"""

import json
import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    GraphData,
    Node,
    Edge,
    ShortestPathRequest,
    PathResponse,
    NearestFacilityRequest,
    NearestFacilityResponse,
    BlockRoadRequest,
    BlockRoadResponse,
    CompareAlgorithmsRequest,
    CompareAlgorithmsResponse
)
from app.graph import CityGraph
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.astar import run_astar
from app.algorithms.bellman_ford import run_bellman_ford
from app.algorithms.multi_source import find_nearest_facility
from app.algorithms.alternate_path import find_alternate_path

app = FastAPI(
    title="Route-O-Rescue API",
    description="Emergency Services Shortest Path Planning & Graph Optimization API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load sample city data into default global graph
SAMPLE_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_city.json")

def load_default_graph_data() -> GraphData:
    with open(SAMPLE_DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return GraphData(**raw)

default_graph_data = load_default_graph_data()
current_graph = CityGraph(default_graph_data)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Route-O-Rescue",
        "nodes_count": len(current_graph.nodes),
        "edges_count": len(current_graph.edges)
    }


@app.get("/api/graph", response_model=GraphData)
def get_graph():
    """Get the current in-memory graph."""
    return current_graph.to_graph_data()


@app.post("/api/graph", response_model=GraphData)
def update_graph(graph_data: GraphData):
    """Import or replace the active graph."""
    if not graph_data.nodes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Graph must contain at least one node."
        )
    global current_graph
    current_graph = CityGraph(graph_data)
    return current_graph.to_graph_data()


@app.post("/api/graph/reset", response_model=GraphData)
def reset_graph():
    """Reset graph to the default 24-node Metro City sample dataset."""
    global current_graph
    fresh_data = load_default_graph_data()
    current_graph = CityGraph(fresh_data)
    return current_graph.to_graph_data()


@app.post("/api/node", response_model=Node)
def add_or_update_node(node: Node):
    """Add a new node or update an existing node."""
    current_graph.add_node(node)
    return node


@app.delete("/api/node/{node_id}")
def delete_node(node_id: str):
    """Delete a node and all connecting edges."""
    if node_id not in current_graph.nodes:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found.")
    current_graph.remove_node(node_id)
    return {"message": f"Node '{node_id}' and its edges deleted successfully."}


@app.post("/api/edge", response_model=Edge)
def add_or_update_edge(edge: Edge):
    """Add a new edge or update an existing edge."""
    if edge.source not in current_graph.nodes:
        raise HTTPException(status_code=400, detail=f"Source node '{edge.source}' does not exist.")
    if edge.target not in current_graph.nodes:
        raise HTTPException(status_code=400, detail=f"Target node '{edge.target}' does not exist.")
    current_graph.add_edge(edge)
    return edge


@app.delete("/api/edge/{edge_id}")
def delete_edge(edge_id: str):
    """Delete an edge by ID."""
    if edge_id not in current_graph.edges:
        raise HTTPException(status_code=404, detail=f"Edge '{edge_id}' not found.")
    current_graph.remove_edge(edge_id)
    return {"message": f"Edge '{edge_id}' deleted successfully."}


@app.post("/api/shortest-path", response_model=PathResponse)
def compute_shortest_path(request: ShortestPathRequest):
    """
    Compute shortest route between source and destination using the specified algorithm
    (Dijkstra, A*, or Bellman-Ford). Returns path, distance, travel time, and step trace.
    """
    graph_to_use = CityGraph(request.graph) if request.graph else current_graph

    if request.source not in graph_to_use.nodes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source node '{request.source}' not found."
        )
    if request.destination not in graph_to_use.nodes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination node '{request.destination}' not found."
        )

    algo = request.algorithm.lower()
    if algo == "dijkstra":
        res = run_dijkstra(graph_to_use, request.source, request.destination, request.include_steps)
    elif algo == "astar":
        res = run_astar(graph_to_use, request.source, request.destination, request.include_steps)
    elif algo == "bellman_ford":
        res = run_bellman_ford(graph_to_use, request.source, request.destination, request.include_steps)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported algorithm '{request.algorithm}'. Choose from dijkstra, astar, bellman_ford."
        )

    return res


@app.post("/api/nearest-facility", response_model=NearestFacilityResponse)
def compute_nearest_facility(request: NearestFacilityRequest):
    """
    Auto-find the nearest suitable facility (hospital, fire_station, police_station)
    to an incident node using Multi-Source Dijkstra.
    Also returns a backup secondary route.
    """
    graph_to_use = CityGraph(request.graph) if request.graph else current_graph

    if request.incident_node_id not in graph_to_use.nodes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident node '{request.incident_node_id}' not found."
        )

    return find_nearest_facility(
        graph=graph_to_use,
        incident_node_id=request.incident_node_id,
        facility_type=request.facility_type,
        algorithm=request.algorithm
    )


@app.post("/api/block-road", response_model=BlockRoadResponse)
def block_or_unblock_road(request: BlockRoadRequest):
    """
    Toggle edge blockage or update traffic multiplier and automatically re-calculate route.
    """
    global current_graph
    graph_to_use = current_graph
    if request.graph:
        graph_to_use = CityGraph(request.graph)
        current_graph = graph_to_use

    edge = graph_to_use.update_edge_status(
        edge_id=request.edge_id,
        status=request.status,
        traffic_multiplier=request.traffic_multiplier
    )

    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edge '{request.edge_id}' not found in graph."
        )

    recomputed_path: Optional[PathResponse] = None
    if request.recompute and request.active_source and request.active_destination:
        if request.algorithm == "astar":
            recomputed_path = run_astar(graph_to_use, request.active_source, request.active_destination)
        elif request.algorithm == "bellman_ford":
            recomputed_path = run_bellman_ford(graph_to_use, request.active_source, request.active_destination)
        else:
            recomputed_path = run_dijkstra(graph_to_use, request.active_source, request.active_destination)

    action_text = "blocked" if request.status == "blocked" else "unblocked (open)"
    return BlockRoadResponse(
        edge=edge,
        graph=graph_to_use.to_graph_data(),
        recomputed_path=recomputed_path,
        message=f"Road {edge.source} <-> {edge.target} ({edge.id}) is now {action_text}."
    )


@app.post("/api/compare", response_model=CompareAlgorithmsResponse)
def compare_algorithms(request: CompareAlgorithmsRequest):
    """
    Compare Dijkstra, A*, and Bellman-Ford on the exact same graph and endpoints.
    Provides performance metrics, visited node count, execution time, and complexities.
    """
    graph_to_use = CityGraph(request.graph) if request.graph else current_graph

    if request.source not in graph_to_use.nodes:
        raise HTTPException(status_code=404, detail=f"Source node '{request.source}' not found.")
    if request.destination not in graph_to_use.nodes:
        raise HTTPException(status_code=404, detail=f"Destination node '{request.destination}' not found.")

    dijkstra_res = run_dijkstra(graph_to_use, request.source, request.destination, include_steps=False)
    astar_res = run_astar(graph_to_use, request.source, request.destination, include_steps=False)
    bellman_res = run_bellman_ford(graph_to_use, request.source, request.destination, include_steps=False)

    summary = {
        "fastest_execution_algo": min(
            [("Dijkstra", dijkstra_res.execution_time_ms),
             ("A*", astar_res.execution_time_ms),
             ("Bellman-Ford", bellman_res.execution_time_ms)],
            key=lambda x: x[1]
        )[0],
        "least_nodes_visited_algo": min(
            [("Dijkstra", dijkstra_res.nodes_visited_count),
             ("A*", astar_res.nodes_visited_count),
             ("Bellman-Ford", bellman_res.nodes_visited_count)],
            key=lambda x: x[1]
        )[0],
        "cost_match": (
            abs(dijkstra_res.total_cost - astar_res.total_cost) < 1e-4 and
            abs(dijkstra_res.total_cost - bellman_res.total_cost) < 1e-4
        ) if dijkstra_res.found else False
    }

    return CompareAlgorithmsResponse(
        source=request.source,
        destination=request.destination,
        dijkstra=dijkstra_res,
        astar=astar_res,
        bellman_ford=bellman_res,
        summary=summary
    )
