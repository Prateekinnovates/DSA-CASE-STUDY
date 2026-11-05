"""
A* Search Algorithm implemented manually from scratch using MinHeap and admissible heuristics.
No external graph libraries used.
Includes step recorder with g(n), h(n), f(n) states for step-by-step animation.
"""

import time
from typing import Dict, List, Optional, Tuple
from app.algorithms.priority_queue import MinHeap
from app.graph import CityGraph
from app.models import PathResponse, PathStep, Node


def run_astar(
    graph: CityGraph,
    source: str,
    destination: str,
    include_steps: bool = True
) -> PathResponse:
    """
    Compute shortest path using A* search with Haversine/Euclidean admissible heuristic.
    """
    start_time = time.perf_counter()

    time_complexity = "O(E) best, O(V log V) average"
    space_complexity = "O(V + E)"

    if source not in graph.nodes:
        return PathResponse(
            algorithm="astar",
            found=False,
            source=source,
            destination=destination,
            error_message=f"Source node '{source}' does not exist in graph.",
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    if destination not in graph.nodes:
        return PathResponse(
            algorithm="astar",
            found=False,
            source=source,
            destination=destination,
            error_message=f"Destination node '{destination}' does not exist in graph.",
            time_complexity=time_complexity,
            space_complexity=space_complexity,
        )

    steps: List[PathStep] = []
    step_num = 0

    # Same source and destination
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
            algorithm="astar",
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

    # g_score: actual cost from source to n
    g_score: Dict[str, float] = {node_id: float("inf") for node_id in graph.nodes}
    g_score[source] = 0.0

    # f_score: g_score + h(n)
    initial_h = graph.heuristic(source, destination)
    f_score: Dict[str, float] = {node_id: float("inf") for node_id in graph.nodes}
    f_score[source] = initial_h

    predecessors: Dict[str, Optional[Tuple[str, str, float]]] = {node_id: None for node_id in graph.nodes}
    visited: set = set()

    pq = MinHeap()
    pq.push(source, f_score[source])

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
            distances={k: round(v, 2) for k, v in g_score.items() if v < float("inf")},
            message=f"Initialized A* at source '{graph.nodes[source].name}'. h(source, dest) = {initial_h:.2f} mins."
        ))

    destination_reached = False

    while not pq.is_empty():
        curr_node, curr_f = pq.pop()

        if curr_node in visited:
            continue

        visited.add(curr_node)
        nodes_visited_count += 1
        curr_g = g_score[curr_node]
        curr_h = graph.heuristic(curr_node, destination)

        if include_steps:
            step_num += 1
            steps.append(PathStep(
                step_num=step_num,
                action="visit_node",
                current_node=curr_node,
                visited_nodes=list(visited),
                frontier=pq.to_list(),
                distances={k: round(v, 2) for k, v in g_score.items() if v < float("inf")},
                message=f"Examining node '{graph.nodes[curr_node].name}' ({curr_node}) [g={curr_g:.2f}, h={curr_h:.2f}, f={curr_f:.2f}]."
            ))

        if curr_node == destination:
            destination_reached = True
            break

        for neighbor_id, edge in graph.get_neighbors(curr_node):
            if neighbor_id in visited:
                continue

            weight = graph.get_edge_weight(edge)
            if weight == float("inf"):
                continue

            tentative_g = curr_g + weight

            if tentative_g < g_score[neighbor_id]:
                edges_relaxed_count += 1
                old_g = g_score[neighbor_id]
                g_score[neighbor_id] = tentative_g
                h_val = graph.heuristic(neighbor_id, destination)
                new_f = tentative_g + h_val
                f_score[neighbor_id] = new_f
                predecessors[neighbor_id] = (curr_node, edge.id, edge.distance_km)
                pq.push(neighbor_id, new_f)

                if include_steps:
                    step_num += 1
                    steps.append(PathStep(
                        step_num=step_num,
                        action="relax_edge",
                        current_node=curr_node,
                        visited_nodes=list(visited),
                        frontier=pq.to_list(),
                        distances={k: round(v, 2) for k, v in g_score.items() if v < float("inf")},
                        edge_relaxed={
                            "edge_id": edge.id,
                            "source": curr_node,
                            "target": neighbor_id,
                            "weight": round(weight, 2),
                            "old_g": round(old_g, 2) if old_g < float("inf") else "inf",
                            "new_g": round(tentative_g, 2),
                            "h": round(h_val, 2),
                            "f": round(new_f, 2)
                        },
                        message=f"A* relaxed edge {curr_node} -> {neighbor_id}: g={tentative_g:.2f}, h={h_val:.2f}, f={new_f:.2f}."
                    ))

    exec_ms = (time.perf_counter() - start_time) * 1000.0

    if not destination_reached and g_score[destination] == float("inf"):
        if include_steps:
            step_num += 1
            steps.append(PathStep(
                step_num=step_num,
                action="no_path",
                current_node=None,
                visited_nodes=list(visited),
                frontier=[],
                distances={k: round(v, 2) for k, v in g_score.items() if v < float("inf")},
                message=f"No passable path exists between '{source}' and '{destination}' (roads blocked or graph disconnected)."
            ))
        return PathResponse(
            algorithm="astar",
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
    total_time_min = g_score[destination]

    if include_steps:
        step_num += 1
        steps.append(PathStep(
            step_num=step_num,
            action="complete",
            current_node=destination,
            visited_nodes=list(visited),
            frontier=[],
            distances={k: round(v, 2) for k, v in g_score.items() if v < float("inf")},
            message=f"A* optimal path found! Explored {nodes_visited_count} nodes vs total {len(graph.nodes)}."
        ))

    return PathResponse(
        algorithm="astar",
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

