"""
Unit tests for FastAPI REST API endpoints using TestClient.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["nodes_count"] >= 20
    assert data["edges_count"] >= 35


def test_api_get_graph():
    res = client.get("/api/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 20


def test_api_shortest_path_dijkstra():
    payload = {
        "source": "F1",
        "destination": "A1",
        "algorithm": "dijkstra",
        "include_steps": True
    }
    res = client.post("/api/shortest-path", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["source"] == "F1"
    assert data["destination"] == "A1"
    assert len(data["path"]) > 1
    assert data["total_distance_km"] > 0
    assert len(data["steps"]) > 0


def test_api_shortest_path_astar():
    payload = {
        "source": "F1",
        "destination": "A1",
        "algorithm": "astar",
        "include_steps": True
    }
    res = client.post("/api/shortest-path", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["source"] == "F1"


def test_api_shortest_path_bellman_ford():
    payload = {
        "source": "P1",
        "destination": "H2",
        "algorithm": "bellman_ford",
        "include_steps": False
    }
    res = client.post("/api/shortest-path", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True


def test_api_nearest_facility():
    payload = {
        "incident_node_id": "A1",
        "facility_type": "hospital",
        "algorithm": "dijkstra"
    }
    res = client.post("/api/nearest-facility", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["nearest_facility"] is not None
    assert data["nearest_facility"]["type"] == "hospital"
    assert data["shortest_path"]["found"] is True


def test_api_block_road():
    # Toggle edge e25 status
    payload = {
        "edge_id": "e25",
        "status": "blocked",
        "recompute": True,
        "active_source": "J8",
        "active_destination": "A1",
        "algorithm": "dijkstra"
    }
    res = client.post("/api/block-road", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["edge"]["status"] == "blocked"

    # Restore e25
    payload["status"] = "open"
    res_restore = client.post("/api/block-road", json=payload)
    assert res_restore.status_code == 200
    assert res_restore.json()["edge"]["status"] == "open"


def test_api_compare():
    payload = {
        "source": "F1",
        "destination": "H2"
    }
    res = client.post("/api/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "dijkstra" in data
    assert "astar" in data
    assert "bellman_ford" in data
    assert "summary" in data


def test_api_validation_errors():
    # Invalid node
    payload = {
        "source": "NON_EXISTENT",
        "destination": "A1",
        "algorithm": "dijkstra"
    }
    res = client.post("/api/shortest-path", json=payload)
    assert res.status_code == 404

    # Invalid algorithm
    payload_bad_algo = {
        "source": "F1",
        "destination": "A1",
        "algorithm": "quantum_leap"
    }
    res_bad_algo = client.post("/api/shortest-path", json=payload_bad_algo)
    assert res_bad_algo.status_code in (400, 422)

