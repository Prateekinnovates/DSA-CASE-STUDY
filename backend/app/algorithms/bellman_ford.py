"""
Bellman-Ford Algorithm implemented manually from scratch.
No external graph libraries used.
Demonstrates iterative dynamic weight handling, negative cycle detection, and step recorder.
"""

import time
from typing import Dict, List, Optional, Tuple
from app.graph import CityGraph
from app.models import PathResponse, PathStep, Node


def run_bellman_ford(
    graph: CityGraph,
    source: str,
    destination: str,
    include_steps: bool = True
) -> PathResponse:
    """
    Compute shortest path using Bellman-Ford algorithm.
    Handles dynamic weights and records iteration passes for comparison and visualization.
    """
    start_time = time.perf_counter()

    time_complexity = "O(V * E)"
    space_complexity = "O(V)"

    if source not in graph.nodes:
        return PathResponse(
            algorithm="bellman_ford",
            found=False,
            source=source,
            destination=destination,
            error_message=f"Source node '{source}' does not exist in graph.",
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    if destination not in graph.nodes:
        return PathResponse(
            algorithm="bellman_ford",
            found=False,
            source=source,
            destination=destination,
            error_message=f"Destination node '{destination}' does not exist in graph.",
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    steps: List[PathStep] = []
    step_num = 0

    if source == destination:
        node_obj = graph.nodes[source]
        exec_ms = (time.perf_counter() - start_time) * 1000.0
        if include_steps:
            steps.append(PathStep(
                step_num=1,
                action="complete",
                current_node=source,
                visited_nodes=[source],
                frontier=[],
                distances={source: 0.0},
                message=f"Source and destination are identical ({source}). Path length is 0."
            ))
        return PathResponse(
            algorithm="bellman_ford",
            found=True,
            source=source,
            destination=destination,
            path=[source],
            path_nodes=[node_obj],
            total_distance_km=0.0,
            estimated_time_minutes=0.0,
            total_cost=0.0,
            nodes_visited_count=1,
            edges_relaxed_count=0,
            execution_time_ms=round(exec_ms, 3),
            steps=steps,
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    # Initialize distances
    distances: Dict[str, float] = {node_id: float("inf") for node_id in graph.nodes}
    distances[source] = 0.0
    predecessors: Dict[str, Optional[Tuple[str, str, float]]] = {node_id: None for node_id in graph.nodes}

    # Flatten list of active directed edge instances from the adjacency list
    # (Since graph.adj holds both forward and reverse when bidirectional)
    all_edges: List[Tuple[str, str, float, float, str]] = []  # (u, v, weight, dist_km, edge_id)
    for u, neighbors in graph.adj.items():
        for v, edge in neighbors:
            w = graph.get_edge_weight(edge)
            if w < float("inf"):
                all_edges.append((u, v, w, edge.distance_km, edge.id))

    num_vertices = len(graph.nodes)
    edges_relaxed_count = 0
    visited_nodes: set = {source}

    if include_steps:
        step_num += 1
        steps.append(PathStep(
            step_num=step_num,
            action="init",
            current_node=source,
            visited_nodes=list(visited_nodes),
            frontier=[],
            distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
            message=f"Initialized Bellman-Ford at '{source}'. Starting {num_vertices - 1} maximum iteration passes."
        ))

    # Relax edges up to V - 1 times
    for iteration in range(1, num_vertices):
        updated = False
        iteration_relaxations = 0

        for u, v, weight, dist_km, edge_id in all_edges:
            if distances[u] != float("inf") and distances[u] + weight < distances[v]:
                old_dist = distances[v]
                new_dist = distances[u] + weight
                distances[v] = new_dist
                predecessors[v] = (u, edge_id, dist_km)
                visited_nodes.add(u)
                visited_nodes.add(v)
                edges_relaxed_count += 1
                iteration_relaxations += 1
                updated = True

                if include_steps and iteration_relaxations <= 4:
                    step_num += 1
                    steps.append(PathStep(
                        step_num=step_num,
                        action="relax_edge",
                        current_node=u,
                        visited_nodes=list(visited_nodes),
                        frontier=[],
                        distances={k: round(val, 2) for k, val in distances.items() if val < float("inf")},
                        edge_relaxed={
                            "edge_id": edge_id,
                            "source": u,
                            "target": v,
                            "weight": round(weight, 2),
                            "old_dist": round(old_dist, 2) if old_dist < float("inf") else "inf",
                            "new_dist": round(new_dist, 2),
                            "round": iteration
                        },
                        message=f"Pass {iteration}: relaxed {u} -> {v} (new cost: {new_dist:.2f} mins)."
                    ))

        if include_steps and iteration_relaxations > 0:
            step_num += 1
            steps.append(PathStep(
                step_num=step_num,
                action="pass_complete",
                current_node=None,
                visited_nodes=list(visited_nodes),
                frontier=[],
                distances={k: round(val, 2) for k, val in distances.items() if val < float("inf")},
                message=f"Iteration pass {iteration}/{num_vertices - 1} complete. {iteration_relaxations} edges relaxed."
            ))

        # Early termination if no distance changed
        if not updated:
            if include_steps:
                step_num += 1
                steps.append(PathStep(
                    step_num=step_num,
                    action="converged",
                    current_node=None,
                    visited_nodes=list(visited_nodes),
                    frontier=[],
                    distances={k: round(val, 2) for k, val in distances.items() if val < float("inf")},
                    message=f"Bellman-Ford converged early at iteration pass {iteration} (no changes detected)."
                ))
            break

    # Check for negative weight cycles
    has_negative_cycle = False
    for u, v, weight, _, _ in all_edges:
        if distances[u] != float("inf") and distances[u] + weight < distances[v]:
            has_negative_cycle = True
            break

    exec_ms = (time.perf_counter() - start_time) * 1000.0

    if has_negative_cycle:
        return PathResponse(
            algorithm="bellman_ford",
            found=False,
            source=source,
            destination=destination,
            nodes_visited_count=len(visited_nodes),
            edges_relaxed_count=edges_relaxed_count,
            execution_time_ms=round(exec_ms, 3),
            steps=steps,
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            error_message="Negative weight cycle detected in the road network."
        )

    if distances[destination] == float("inf"):
        if include_steps:
            step_num += 1
            steps.append(PathStep(
                step_num=step_num,
                action="no_path",
                current_node=None,
                visited_nodes=list(visited_nodes),
                frontier=[],
                distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
                message=f"No passable path exists between '{source}' and '{destination}'."
            ))
        return PathResponse(
            algorithm="bellman_ford",
            found=False,
            source=source,
            destination=destination,
            nodes_visited_count=len(visited_nodes),
            edges_relaxed_count=edges_relaxed_count,
            execution_time_ms=round(exec_ms, 3),
            steps=steps,
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            error_message="No accessible path found between the specified locations."
        )

    # Reconstruct path
    path: List[str] = []
    curr = destination
    total_distance_km = 0.0

    while curr is not None:
        path.append(curr)
        pred_info = predecessors[curr]
        if pred_info is not None:
            prev_node, _, dist_km = pred_info
            total_distance_km += dist_km
            curr = prev_node
        else:
            curr = None

    path.reverse()
    path_nodes = [graph.nodes[nid] for nid in path if nid in graph.nodes]
    total_time_min = distances[destination]

    if include_steps:
        step_num += 1
        steps.append(PathStep(
            step_num=step_num,
            action="complete",
            current_node=destination,
            visited_nodes=list(visited_nodes),
            frontier=[],
            distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
            message=f"Bellman-Ford path computed. Distance: {total_distance_km:.2f} km, Time: {total_time_min:.2f} mins."
        ))

    return PathResponse(
        algorithm="bellman_ford",
        found=True,
        source=source,
        destination=destination,
        path=path,
        path_nodes=path_nodes,
        total_distance_km=round(total_distance_km, 2),
        estimated_time_minutes=round(total_time_min, 2),
        total_cost=round(total_time_min, 2),
        nodes_visited_count=len(visited_nodes),
        edges_relaxed_count=edges_relaxed_count,
        execution_time_ms=round(exec_ms, 3),
        steps=steps,
        time_complexity=time_complexity,
        space_complexity=space_complexity,
    )

