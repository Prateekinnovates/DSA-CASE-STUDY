export type NodeType = "hospital" | "fire_station" | "police_station" | "junction" | "accident";
export type RoadStatus = "open" | "blocked";
export type AlgorithmType = "dijkstra" | "astar" | "bellman_ford";
export type EmergencyType = "ambulance" | "fire_truck" | "police";

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  lat: number;
  lng: number;
  description?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  distance_km: number;
  traffic_multiplier: number;
  status: RoadStatus;
  max_speed_kmh: number;
  bidirectional?: boolean;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface PathStep {
  step_num: number;
  action: string;
  current_node?: string | null;
  visited_nodes: string[];
  frontier: Array<{ item: string; priority: number }>;
  distances: Record<string, number>;
  edge_relaxed?: {
    edge_id: string;
    source: string;
    target: string;
    weight: number;
    old_dist?: number | string;
    new_dist?: number;
    old_g?: number | string;
    new_g?: number;
    h?: number;
    f?: number;
    round?: number;
  } | null;
  message: string;
}

export interface PathResponse {
  algorithm: string;
  found: boolean;
  source: string;
  destination: string;
  path: string[];
  path_nodes: Node[];
  total_distance_km: number;
  estimated_time_minutes: number;
  total_cost: number;
  nodes_visited_count: number;
  edges_relaxed_count: number;
  execution_time_ms: number;
  steps: PathStep[];
  time_complexity: string;
  space_complexity: string;
  error_message?: string | null;
}

export interface NearestFacilityResponse {
  incident_node: Node;
  facility_type: string;
  nearest_facility: Node | null;
  shortest_path: PathResponse | null;
  backup_path: PathResponse | null;
  all_facilities_evaluated: Array<{
    facility_id: string;
    name: string;
    distance_km: number | null;
    travel_time_minutes: number | null;
    path: string[];
    reachable: boolean;
  }>;
  message: string;
}

export interface BlockRoadResponse {
  edge: Edge;
  graph: GraphData;
  recomputed_path: PathResponse | null;
  message: string;
}

export interface CompareAlgorithmsResponse {
  source: string;
  destination: string;
  dijkstra: PathResponse;
  astar: PathResponse;
  bellman_ford: PathResponse;
  summary: {
    fastest_execution_algo: string;
    least_nodes_visited_algo: string;
    cost_match: boolean;
  };
}

