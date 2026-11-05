"""
Unit tests for edge cases:
- Disconnected graph
- Same source and destination
- Zero-weight edges
- Blocked roads & dynamic rerouting
- Invalid nodes
"""

from app.graph import CityGraph
from app.models import Node, Edge, GraphData
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.astar import run_astar
from app.algorithms.bellman_ford import run_bellman_ford


def test_same_source_and_destination():
    nodes = [Node(id="X", name="Station X", type="hospital", lat=40.0, lng=-74.0)]
    graph = CityGraph(GraphData(nodes=nodes, edges=[]))

    res = run_dijkstra(graph, "X", "X")
    assert res.found is True
    assert res.path == ["X"]
    assert res.total_distance_km == 0.0
    assert res.total_cost == 0.0

    astar_res = run_astar(graph, "X", "X")
    assert astar_res.found is True
    assert astar_res.path == ["X"]
    assert astar_res.total_distance_km == 0.0

    bf_res = run_bellman_ford(graph, "X", "X")
    assert bf_res.found is True
    assert bf_res.path == ["X"]


def test_disconnected_graph():
    nodes = [
        Node(id="A", name="Node A", type="junction", lat=40.0, lng=-74.0),
        Node(id="B", name="Node B", type="junction", lat=40.1, lng=-74.1),
        Node(id="C", name="Island C", type="junction", lat=40.2, lng=-74.2),
    ]
    edges = [
        Edge(id="e1", source="A", target="B", distance_km=2.0)
    ]
    graph = CityGraph(GraphData(nodes=nodes, edges=edges))

    res = run_dijkstra(graph, "A", "C")
    assert res.found is False
    assert res.path == []
    assert res.error_message is not None

    astar_res = run_astar(graph, "A", "C")
    assert astar_res.found is False

    bf_res = run_bellman_ford(graph, "A", "C")
    assert bf_res.found is False


def test_blocked_road_rerouting():
    # 2 routes from S to D:
    # Route 1: S -> A -> D (shorter: 1 + 1 = 2 km)
    # Route 2: S -> B -> D (longer: 3 + 3 = 6 km)
    nodes = [
        Node(id="S", name="Start", type="hospital", lat=40.0, lng=-74.0),
        Node(id="A", name="Route 1", type="junction", lat=40.1, lng=-74.0),
        Node(id="B", name="Route 2", type="junction", lat=40.0, lng=-73.9),
        Node(id="D", name="Dest", type="accident", lat=40.1, lng=-73.9),
    ]
    edges = [
        Edge(id="e1", source="S", target="A", distance_km=1.0, max_speed_kmh=60),
        Edge(id="e2", source="A", target="D", distance_km=1.0, max_speed_kmh=60),
        Edge(id="e3", source="S", target="B", distance_km=3.0, max_speed_kmh=60),
        Edge(id="e4", source="B", target="D", distance_km=3.0, max_speed_kmh=60),
    ]
    graph = CityGraph(GraphData(nodes=nodes, edges=edges))

    # Before blocking: Route 1 is chosen
    res1 = run_dijkstra(graph, "S", "D")
    assert res1.path == ["S", "A", "D"]

    # Block edge e2
    graph.update_edge_status("e2", "blocked")

    # After blocking: Route 2 is automatically selected
    res2 = run_dijkstra(graph, "S", "D")
    assert res2.found is True
    assert res2.path == ["S", "B", "D"]

    # Block route 2 as well: no route available
    graph.update_edge_status("e3", "blocked")
    res3 = run_dijkstra(graph, "S", "D")
    assert res3.found is False


def test_traffic_congestion_rerouting():
    # Route 1: 2 km, but heavy traffic multiplier 5.0
    # Route 2: 4 km, normal traffic multiplier 1.0
    nodes = [
        Node(id="S", name="Start", type="junction", lat=40.0, lng=-74.0),
        Node(id="A", name="Highway (jammed)", type="junction", lat=40.1, lng=-74.0),
        Node(id="B", name="Bypass (clear)", type="junction", lat=40.0, lng=-73.9),
        Node(id="D", name="Dest", type="junction", lat=40.1, lng=-73.9),
    ]
    edges = [
        Edge(id="e1", source="S", target="A", distance_km=1.0, traffic_multiplier=5.0, max_speed_kmh=60),
        Edge(id="e2", source="A", target="D", distance_km=1.0, traffic_multiplier=5.0, max_speed_kmh=60),
        Edge(id="e3", source="S", target="B", distance_km=2.0, traffic_multiplier=1.0, max_speed_kmh=60),
        Edge(id="e4", source="B", target="D", distance_km=2.0, traffic_multiplier=1.0, max_speed_kmh=60),
    ]
    graph = CityGraph(GraphData(nodes=nodes, edges=edges))

    res = run_dijkstra(graph, "S", "D")
    # Route 2 travel time: (4 / 60) * 60 = 4 mins
    # Route 1 travel time: (2 / (60/5)) * 60 = 10 mins
    # Algorithm should choose faster Route 2
    assert res.path == ["S", "B", "D"]
    assert res.estimated_time_minutes == 4.0


def test_nonexistent_node():
    nodes = [Node(id="A", name="A", type="junction", lat=40.0, lng=-74.0)]
    graph = CityGraph(GraphData(nodes=nodes, edges=[]))

    res = run_dijkstra(graph, "A", "Z_MISSING")
    assert res.found is False
    assert "Destination node 'Z_MISSING' does not exist" in res.error_message

