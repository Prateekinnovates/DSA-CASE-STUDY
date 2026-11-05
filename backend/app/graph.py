"""
Graph representation and utilities for Route-O-Rescue.
Implemented without third-party graph libraries.
"""

import math
from typing import Dict, List, Optional, Tuple
from app.models import Node, Edge, GraphData


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute great-circle distance between two coordinates in kilometers using Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return R * c


def euclidean_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Euclidean distance approximation.
    """
    return math.hypot(lat2 - lat1, lon2 - lon1)


class CityGraph:
    """
    Adjacency-list based city graph representation for emergency dispatching.
    No networkx or external graph libraries used.
    """

    def __init__(self, data: Optional[GraphData] = None):
        self.nodes: Dict[str, Node] = {}
        # adjacency: {source_id: [(target_id, Edge)]}
        self.adj: Dict[str, List[Tuple[str, Edge]]] = {}
        self.edges: Dict[str, Edge] = {}

        if data:
            self.load_from_data(data)

    def load_from_data(self, data: GraphData) -> None:
        """Populate the graph from a GraphData model."""
        self.nodes.clear()
        self.adj.clear()
        self.edges.clear()

        for node in data.nodes:
            self.add_node(node)

        for edge in data.edges:
            self.add_edge(edge)

    def add_node(self, node: Node) -> None:
        """Add a node to the graph."""
        self.nodes[node.id] = node
        if node.id not in self.adj:
            self.adj[node.id] = []

    def remove_node(self, node_id: str) -> None:
        """Remove a node and all connected edges from the graph."""
        if node_id in self.nodes:
            del self.nodes[node_id]
        if node_id in self.adj:
            del self.adj[node_id]

        # Remove outgoing edges to this node
        for u in self.adj:
            self.adj[u] = [(v, edge) for v, edge in self.adj[u] if v != node_id]

        # Clean edges registry
        self.edges = {
            eid: e for eid, e in self.edges.items()
            if e.source != node_id and e.target != node_id
        }

    def add_edge(self, edge: Edge) -> None:
        """Add an edge to the graph (supports bidirectional)."""
        self.edges[edge.id] = edge
        if edge.source not in self.adj:
            self.adj[edge.source] = []
        if edge.target not in self.adj:
            self.adj[edge.target] = []

        # Add forward edge
        self.adj[edge.source].append((edge.target, edge))

        # If bidirectional, add reverse edge
        if edge.bidirectional:
            self.adj[edge.target].append((edge.source, edge))

    def remove_edge(self, edge_id: str) -> None:
        """Remove an edge by its id."""
        if edge_id in self.edges:
            del self.edges[edge_id]

        for u in self.adj:
            self.adj[u] = [(v, edge) for v, edge in self.adj[u] if edge.id != edge_id]

    def update_edge_status(self, edge_id: str, status: str, traffic_multiplier: Optional[float] = None) -> Optional[Edge]:
        """Update road blockage status and traffic multiplier of an edge."""
        if edge_id not in self.edges:
            return None
        edge = self.edges[edge_id]
        edge.status = status
        if traffic_multiplier is not None:
            edge.traffic_multiplier = max(1.0, float(traffic_multiplier))
        return edge

    def get_neighbors(self, node_id: str) -> List[Tuple[str, Edge]]:
        """Return list of (neighbor_id, edge) for given node."""
        return self.adj.get(node_id, [])

    def get_edge_weight(self, edge: Edge) -> float:
        """
        Compute effective weight (travel time in minutes) for an edge.
        If blocked, returns infinity.
        """
        if edge.status == "blocked":
            return float("inf")
        # effective speed considering traffic
        speed_kmh = max(5.0, edge.max_speed_kmh / edge.traffic_multiplier)
        time_minutes = (edge.distance_km / speed_kmh) * 60.0
        return time_minutes

    def get_max_speed(self) -> float:
        """Return maximum speed across all edges (used for A* heuristic scaling)."""
        if not self.edges:
            return 80.0
        return max((e.max_speed_kmh for e in self.edges.values()), default=80.0)

    def heuristic(self, node_a_id: str, node_b_id: str) -> float:
        """
        Admissible and consistent heuristic for A* in minutes.
        Distance divided by maximum possible network speed.
        Since true speed <= max_speed and road path >= straight-line distance,
        h(n) is guaranteed to never overestimate the actual remaining travel time.
        """
        if node_a_id not in self.nodes or node_b_id not in self.nodes:
            return 0.0
        na = self.nodes[node_a_id]
        nb = self.nodes[node_b_id]
        dist_km = haversine_distance_km(na.lat, na.lng, nb.lat, nb.lng)
        max_speed = self.get_max_speed()
        # time in minutes
        return (dist_km / max_speed) * 60.0

    def to_graph_data(self) -> GraphData:
        """Export current graph state to GraphData model."""
        return GraphData(
            nodes=list(self.nodes.values()),
            edges=list(self.edges.values())
        )

