"""
Unit tests for Multi-Source Dijkstra nearest emergency facility dispatching.
"""

from app.graph import CityGraph
from app.models import Node, Edge, GraphData
from app.algorithms.multi_source import find_nearest_facility


def test_nearest_facility_multi_source():
    # Setup two hospitals at different distances to an accident site
    nodes = [
        Node(id="H_FAR", name="Far General Hospital", type="hospital", lat=40.0, lng=-74.0),
        Node(id="H_CLOSE", name="Nearby Trauma Hospital", type="hospital", lat=40.05, lng=-74.0),
        Node(id="J1", name="Junction 1", type="junction", lat=40.02, lng=-74.0),
        Node(id="INCIDENT", name="Car Crash Site", type="accident", lat=40.06, lng=-74.0),
    ]
    edges = [
        # H_FAR path: H_FAR -> J1 (5 km) -> INCIDENT (4 km) = 9 km
        Edge(id="e1", source="H_FAR", target="J1", distance_km=5.0, max_speed_kmh=60),
        Edge(id="e2", source="J1", target="INCIDENT", distance_km=4.0, max_speed_kmh=60),
        # H_CLOSE path: H_CLOSE -> INCIDENT (1 km) = 1 km
        Edge(id="e3", source="H_CLOSE", target="INCIDENT", distance_km=1.0, max_speed_kmh=60),
    ]
    graph = CityGraph(GraphData(nodes=nodes, edges=edges))

    res = find_nearest_facility(graph, incident_node_id="INCIDENT", facility_type="hospital")

    assert res.nearest_facility is not None
    assert res.nearest_facility.id == "H_CLOSE"
    assert res.shortest_path is not None
    assert res.shortest_path.path == ["H_CLOSE", "INCIDENT"]
    assert res.shortest_path.total_distance_km == 1.0


def test_no_facilities_available():
    nodes = [
        Node(id="A", name="Accident Site", type="accident", lat=40.0, lng=-74.0),
        Node(id="P1", name="Police Station", type="police_station", lat=40.1, lng=-74.0)
    ]
    edges = [
        Edge(id="e1", source="P1", target="A", distance_km=2.0)
    ]
    graph = CityGraph(GraphData(nodes=nodes, edges=edges))

    # Ask for fire_station when none exist
    res = find_nearest_facility(graph, incident_node_id="A", facility_type="fire_station")
    assert res.nearest_facility is None
    assert "No facilities of type 'fire_station' found" in res.message

