"""
Unit tests for Dijkstra, A*, and Bellman-Ford algorithms on the city graph.
"""

import pytest
from app.graph import CityGraph
from app.models import Node, Edge, GraphData
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.astar import run_astar
from app.algorithms.bellman_ford import run_bellman_ford
from app.algorithms.alternate_path import find_alternate_path


@pytest.fixture
def sample_graph():
    # Simple diamond graph
    # S -> A (cost 2) -> D (cost 4) => total 6
    # S -> B (cost 5) -> D (cost 2) => total 7
    nodes = [
        Node(id="S", name="Start", type="junction", lat=40.0, lng=-74.0),
        Node(id="A", name="A", type="junction", lat=40.1, lng=-74.0),
        Node(id="B", name="B", type="junction", lat=40.0, lng=-73.9),
        Node(id="D", name="Dest", type="junction", lat=40.1, lng=-73.9),
    ]
    edges = [
        Edge(id="e1", source="S", target="A", distance_km=2.0, max_speed_kmh=60.0),
        Edge(id="e2", source="A", target="D", distance_km=4.0, max_speed_kmh=60.0),
        Edge(id="e3", source="S", target="B", distance_km=5.0, max_speed_kmh=60.0),
        Edge(id="e4", source="B", target="D", distance_km=2.0, max_speed_kmh=60.0),
    ]
    return CityGraph(GraphData(nodes=nodes, edges=edges))


def test_dijkstra_shortest_path(sample_graph):
    res = run_dijkstra(sample_graph, "S", "D")
    assert res.found is True
    assert res.path == ["S", "A", "D"]
    assert res.total_distance_km == 6.0
    # Travel time: 6.0 km at 60 km/h = 6 mins
    assert abs(res.estimated_time_minutes - 6.0) < 1e-3
    assert len(res.steps) > 0


def test_astar_matches_dijkstra(sample_graph):
    dijkstra_res = run_dijkstra(sample_graph, "S", "D")
    astar_res = run_astar(sample_graph, "S", "D")

    assert astar_res.found is True
    assert astar_res.path == dijkstra_res.path
    assert abs(astar_res.total_cost - dijkstra_res.total_cost) < 1e-4
    assert len(astar_res.steps) > 0


def test_bellman_ford_matches_dijkstra(sample_graph):
    dijkstra_res = run_dijkstra(sample_graph, "S", "D")
    bellman_res = run_bellman_ford(sample_graph, "S", "D")

    assert bellman_res.found is True
    assert bellman_res.path == dijkstra_res.path
    assert abs(bellman_res.total_cost - dijkstra_res.total_cost) < 1e-4


def test_alternate_backup_path(sample_graph):
    primary_res = run_dijkstra(sample_graph, "S", "D")
    assert primary_res.path == ["S", "A", "D"]

    backup_res = find_alternate_path(sample_graph, "S", "D", primary_res)
    assert backup_res is not None
    assert backup_res.found is True
    assert backup_res.path == ["S", "B", "D"]
    assert backup_res.total_distance_km == 7.0
    assert backup_res.total_cost > primary_res.total_cost

