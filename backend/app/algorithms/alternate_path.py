"""
Second-shortest path (Backup route) implementation for emergency resilience.
Uses Yen's edge-deviation method with scratch Dijkstra.
No external graph libraries used.
"""

from typing import Optional, List
from app.graph import CityGraph
from app.models import PathResponse
from app.algorithms.dijkstra import run_dijkstra


def find_alternate_path(
    graph: CityGraph,
    source: str,
    destination: str,
    primary_path: PathResponse
) -> Optional[PathResponse]:
    """
    Compute a backup (second-shortest) route by temporarily removing edges
    from the primary route to find the most optimal non-identical alternative.
    """
    if not primary_path.found or len(primary_path.path) < 2:
        return None

    best_alternate: Optional[PathResponse] = None
    best_cost = float("inf")

    # Iterate over consecutive node pairs in the primary path
    for i in range(len(primary_path.path) - 1):
        u = primary_path.path[i]
        v = primary_path.path[i + 1]

        # Find edge(s) connecting u and v
        connecting_edges = [
            edge for target, edge in graph.get_neighbors(u)
            if target == v
        ]

        if not connecting_edges:
            continue

        target_edge = connecting_edges[0]
        original_status = target_edge.status

        # Temporarily block this edge
        target_edge.status = "blocked"

        try:
            candidate = run_dijkstra(graph, source, destination, include_steps=False)

            if candidate.found and candidate.path != primary_path.path:
                if candidate.total_cost < best_cost:
                    best_cost = candidate.total_cost
                    best_alternate = candidate
        finally:
            # Always restore original edge status
            target_edge.status = original_status

    if best_alternate:
        best_alternate.algorithm = f"{best_alternate.algorithm} (Backup Route)"

    return best_alternate

