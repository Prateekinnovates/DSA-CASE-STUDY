"""
Pydantic data models for RescueRoute / Route-O-Rescue.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

NodeType = Literal["hospital", "fire_station", "police_station", "junction", "accident"]
RoadStatus = Literal["open", "blocked"]
AlgorithmType = Literal["dijkstra", "astar", "bellman_ford"]
EmergencyType = Literal["ambulance", "fire_truck", "police"]


class Node(BaseModel):
    id: str = Field(..., description="Unique node identifier (e.g. H1, F2, J3)")
    name: str = Field(..., description="Human-readable name")
    type: NodeType = Field(default="junction", description="Facility or point type")
    lat: float = Field(..., description="Latitude / Y coordinate")
    lng: float = Field(..., description="Longitude / X coordinate")
    description: Optional[str] = Field(default="", description="Additional details")


class Edge(BaseModel):
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node id")
    target: str = Field(..., description="Target node id")
    distance_km: float = Field(..., gt=0.0, description="Road distance in kilometers")
    traffic_multiplier: float = Field(default=1.0, ge=1.0, description="Traffic factor (1.0 = normal, 2.0 = heavy)")
    status: RoadStatus = Field(default="open", description="Road condition: open or blocked")
    max_speed_kmh: float = Field(default=50.0, gt=0.0, description="Speed limit in km/h")
    bidirectional: bool = Field(default=True, description="Whether traffic moves both ways")


class GraphData(BaseModel):
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)


class PathStep(BaseModel):
    step_num: int
    action: str = Field(..., description="Action: visit_node, relax_edge, update_dist, complete, no_path")
    current_node: Optional[str] = None
    visited_nodes: List[str] = Field(default_factory=list)
    frontier: List[Dict[str, Any]] = Field(default_factory=list)
    distances: Dict[str, float] = Field(default_factory=dict)
    edge_relaxed: Optional[Dict[str, Any]] = None
    message: str = ""


class PathResponse(BaseModel):
    algorithm: str
    found: bool
    source: str
    destination: str
    path: List[str] = Field(default_factory=list)
    path_nodes: List[Node] = Field(default_factory=list)
    total_distance_km: float = 0.0
    estimated_time_minutes: float = 0.0
    total_cost: float = 0.0
    nodes_visited_count: int = 0
    edges_relaxed_count: int = 0
    execution_time_ms: float = 0.0
    steps: List[PathStep] = Field(default_factory=list)
    time_complexity: str = ""
    space_complexity: str = ""
    error_message: Optional[str] = None


class ShortestPathRequest(BaseModel):
    graph: Optional[GraphData] = None
    source: str
    destination: str
    algorithm: AlgorithmType = "dijkstra"
    include_steps: bool = True


class NearestFacilityRequest(BaseModel):
    graph: Optional[GraphData] = None
    incident_node_id: str
    facility_type: Literal["hospital", "fire_station", "police_station"]
    algorithm: AlgorithmType = "dijkstra"


class NearestFacilityResponse(BaseModel):
    incident_node: Node
    facility_type: str
    nearest_facility: Optional[Node] = None
    shortest_path: Optional[PathResponse] = None
    backup_path: Optional[PathResponse] = None
    all_facilities_evaluated: List[Dict[str, Any]] = Field(default_factory=list)
    message: str


class BlockRoadRequest(BaseModel):
    graph: Optional[GraphData] = None
    edge_id: str
    status: RoadStatus = "blocked"
    traffic_multiplier: Optional[float] = None
    recompute: bool = True
    active_source: Optional[str] = None
    active_destination: Optional[str] = None
    algorithm: AlgorithmType = "dijkstra"


class BlockRoadResponse(BaseModel):
    edge: Edge
    graph: GraphData
    recomputed_path: Optional[PathResponse] = None
    message: str


class CompareAlgorithmsRequest(BaseModel):
    graph: Optional[GraphData] = None
    source: str
    destination: str


class CompareAlgorithmsResponse(BaseModel):
    source: str
    destination: str
    dijkstra: PathResponse
    astar: PathResponse
    bellman_ford: PathResponse
    summary: Dict[str, Any]

