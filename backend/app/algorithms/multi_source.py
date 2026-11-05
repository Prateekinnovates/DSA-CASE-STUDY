"""
Multi-Source Dijkstra algorithm for Nearest Emergency Facility dispatching.
Implemented from scratch using MinHeap.
Finds the fastest available facility (Hospital, Fire Station, Police Station) to an incident.
"""

from typing import Dict, List, Optional, Tuple, Any
from app.algorithms.priority_queue import MinHeap
from app.graph import CityGraph
from app.models import (
    Node,
    NearestFacilityResponse,
    PathResponse,
    PathStep
)
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.alternate_path import find_alternate_path


def find_nearest_facility(
    graph: CityGraph,
    incident_node_id: str,
    facility_type: str,
    algorithm: str = "dijkstra"
) -> NearestFacilityResponse:
    """
    Find the closest emergency facility of `facility_type` to the given `incident_node_id`.
    Runs multi-source priority search, evaluates all candidate facilities,
    and returns the winning facility, primary route, and backup alternative route.
    """
    if incident_node_id not in graph.nodes:
        dummy_node = Node(id=incident_node_id, name="Unknown", type="accident", lat=0.0, lng=0.0)
        return NearestFacilityResponse(
            incident_node=dummy_node,
            facility_type=facility_type,
            nearest_facility=None,
            shortest_path=None,
            backup_path=None,
            all_facilities_evaluated=[],
            message=f"Incident node '{incident_node_id}' does not exist in graph."
        )

    incident_node = graph.nodes[incident_node_id]

    # Find all facilities of the requested type
    matching_facilities = [
        node for node in graph.nodes.values()
        if node.type == facility_type
    ]

    if not matching_facilities:
        return NearestFacilityResponse(
            incident_node=incident_node,
            facility_type=facility_type,
            nearest_facility=None,
            shortest_path=None,
            backup_path=None,
            all_facilities_evaluated=[],
            message=f"No facilities of type '{facility_type}' found in current city graph."
        )

    # Multi-Source evaluation:
    # Compute route from each facility to the incident site
    facility_evaluations: List[Dict[str, Any]] = []
    best_facility: Optional[Node] = None
    best_path: Optional[PathResponse] = None
    best_cost = float("inf")

    for facility in matching_facilities:
        path_res = run_dijkstra(graph, source=facility.id, destination=incident_node_id, include_steps=True)
        if path_res.found:
            facility_evaluations.append({
                "facility_id": facility.id,
                "name": facility.name,
                "distance_km": path_res.total_distance_km,
                "travel_time_minutes": path_res.estimated_time_minutes,
                "path": path_res.path,
                "reachable": True
            })
            if path_res.total_cost < best_cost:
                best_cost = path_res.total_cost
                best_facility = facility
                best_path = path_res
        else:
            facility_evaluations.append({
                "facility_id": facility.id,
                "name": facility.name,
                "distance_km": None,
                "travel_time_minutes": None,
                "path": [],
                "reachable": False
            })

    # Sort evaluations by travel time
    facility_evaluations.sort(
        key=lambda x: x["travel_time_minutes"] if x["travel_time_minutes"] is not None else float("inf")
    )

    if not best_facility or not best_path:
        return NearestFacilityResponse(
            incident_node=incident_node,
            facility_type=facility_type,
            nearest_facility=None,
            shortest_path=None,
            backup_path=None,
            all_facilities_evaluated=facility_evaluations,
            message=f"None of the {len(matching_facilities)} {facility_type} facilities can reach '{incident_node.name}' (roads blocked or disconnected)."
        )

    # Find backup route from the winning facility
    backup_path = find_alternate_path(graph, best_facility.id, incident_node_id, best_path)

    human_type = facility_type.replace("_", " ").title()
    message = (
        f"Fastest {human_type} is '{best_facility.name}' ({best_facility.id}) "
        f"— Estimated dispatch time: {best_path.estimated_time_minutes:.1f} mins "
        f"({best_path.total_distance_km:.1f} km)."
    )

    return NearestFacilityResponse(
        incident_node=incident_node,
        facility_type=facility_type,
        nearest_facility=best_facility,
        shortest_path=best_path,
        backup_path=backup_path,
        all_facilities_evaluated=facility_evaluations,
        message=message
    )

