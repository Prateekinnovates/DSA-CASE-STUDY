"""
Dijkstra's Algorithm implemented manually from scratch using MinHeap.
No networkx or graph libraries used.
Includes step recorder for animated front-end visualization.
"""

import time
from typing import Dict, List, Optional, Tuple
from app.algorithms.priority_queue import MinHeap
from app.graph import CityGraph
from app.models import PathResponse, PathStep, Node


def run_dijkstra(
    graph: CityGraph,
    source: str,
    destination: str,
    include_steps: bool = True
) -> PathResponse:
    """
    Compute the shortest path from source to destination using Dijkstra's algorithm.
    Records step-by-step changes for visual playback.
    """
    start_time = time.perf_counter()

    # Complexity constants
    time_complexity = "O((V + E) log V)"
    space_complexity = "O(V + E)"

    # Validation
    if source not in graph.nodes:
        return PathResponse(
            algorithm="dijkstra",
            found=False,
            source=source,
            destination=destination,
            error_message=f"Source node '{source}' does not exist in graph.",
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    if destination not in graph.nodes:
        return PathResponse(
            algorithm="dijkstra",
            found=False,
            source=source,
            destination=destination,
            error_message=f"Destination node '{destination}' does not exist in graph.",
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    steps: List[PathStep] = []
    step_num = 0

    # Same source and destination edge case
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
            algorithm="dijkstra",
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

    # Initialize data structures
    distances: Dict[str, float] = {node_id: float("inf") for node_id in graph.nodes}
    distances[source] = 0.0
    predecessors: Dict[str, Optional[Tuple[str, str, float]]] = {node_id: None for node_id in graph.nodes}
    visited: set = set()

    pq = MinHeap()
    pq.push(source, 0.0)

    nodes_visited_count = 0
    edges_relaxed_count = 0

    if include_steps:
        step_num += 1
        steps.append(PathStep(
            step_num=step_num,
            action="init",
            current_node=source,
            visited_nodes=[],
            frontier=pq.to_list(),
            distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
            message=f"Initialized Dijkstra at source '{graph.nodes[source].name}' ({source}) with distance 0.0."
        ))

    destination_reached = False

    while not pq.is_empty():
        curr_node, curr_dist = pq.pop()

        # If already visited with a shorter path, skip (lazy deletion handling)
        if curr_node in visited:
            continue

        visited.add(curr_node)
        nodes_visited_count += 1

        if include_steps:
            step_num += 1
            steps.append(PathStep(
                step_num=step_num,
                action="visit_node",
                current_node=curr_node,
                visited_nodes=list(visited),
                frontier=pq.to_list(),
                distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
                message=f"Settled node '{graph.nodes[curr_node].name}' ({curr_node}) with minimum cost {curr_dist:.2f} mins."
            ))

        # Check if we reached destination
        if curr_node == destination:
            destination_reached = True
            break

        # Explore neighbors
        for neighbor_id, edge in graph.get_neighbors(curr_node):
            if neighbor_id in visited:
                continue

            # Weight calculation
            weight = graph.get_edge_weight(edge)
            if weight == float("inf"):
                # Road is blocked
                continue

            new_dist = curr_dist + weight

            if new_dist < distances[neighbor_id]:
                edges_relaxed_count += 1
                old_dist = distances[neighbor_id]
                distances[neighbor_id] = new_dist
                predecessors[neighbor_id] = (curr_node, edge.id, edge.distance_km)
                pq.push(neighbor_id, new_dist)

                if include_steps:
                    step_num += 1
                    steps.append(PathStep(
                        step_num=step_num,
                        action="relax_edge",
                        current_node=curr_node,
                        visited_nodes=list(visited),
                        frontier=pq.to_list(),
                        distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
                        edge_relaxed={
                            "edge_id": edge.id,
                            "source": curr_node,
                            "target": neighbor_id,
                            "weight": round(weight, 2),
                            "old_dist": round(old_dist, 2) if old_dist < float("inf") else "inf",
                            "new_dist": round(new_dist, 2)
                        },
                        message=f"Relaxed road {curr_node} -> {neighbor_id}: improved distance to {new_dist:.2f} mins."
                    ))

    exec_ms = (time.perf_counter() - start_time) * 1000.0

    # Path reconstruction
    if not destination_reached and distances[destination] == float("inf"):
        if include_steps:
            step_num += 1
            steps.append(PathStep(
                step_num=step_num,
                action="no_path",
                current_node=None,
                visited_nodes=list(visited),
                frontier=[],
                distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
                message=f"No passable path exists between '{source}' and '{destination}' (roads blocked or graph disconnected)."
            ))
        return PathResponse(
            algorithm="dijkstra",
            found=False,
            source=source,
            destination=destination,
            nodes_visited_count=nodes_visited_count,
            edges_relaxed_count=edges_relaxed_count,
            execution_time_ms=round(exec_ms, 3),
            steps=steps,
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            error_message="No accessible path found between the specified locations."
        )

    # Reconstruct path from destination backwards
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
            visited_nodes=list(visited),
            frontier=[],
            distances={k: round(v, 2) for k, v in distances.items() if v < float("inf")},
            message=f"Shortest path found! Distance: {total_distance_km:.2f} km, Estimated time: {total_time_min:.2f} mins."
        ))

    return PathResponse(
        algorithm="dijkstra",
        found=True,
        source=source,
        destination=destination,
        path=path,
        path_nodes=path_nodes,
        total_distance_km=round(total_distance_km, 2),
        estimated_time_minutes=round(total_time_min, 2),
        total_cost=round(total_time_min, 2),
        nodes_visited_count=nodes_visited_count,
        edges_relaxed_count=edges_relaxed_count,
        execution_time_ms=round(exec_ms, 3),
        steps=steps,
        time_complexity=time_complexity,
        space_complexity=space_complexity,
    )

