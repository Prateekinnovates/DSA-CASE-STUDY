/**
 * Multi-Source Dijkstra for Nearest Emergency Facility dispatching in TypeScript.
 * Evaluates candidate facilities (hospitals, fire stations, police stations)
 * and returns the winning facility, primary route, and backup route.
 */

import { CityGraph } from "./graph";
import { Node, NearestFacilityResponse, PathResponse } from "./types";
import { runDijkstra } from "./dijkstra";
import { findAlternatePath } from "./alternatePath";

export function findNearestFacility(
  graph: CityGraph,
  incidentNodeId: string,
  facilityType: "hospital" | "fire_station" | "police_station",
  algorithm: string = "dijkstra"
): NearestFacilityResponse {
  const incidentNode = graph.nodes.get(incidentNodeId);

  if (!incidentNode) {
    const dummyNode: Node = {
      id: incidentNodeId,
      name: "Unknown",
      type: "accident",
      lat: 0,
      lng: 0,
    };
    return {
      incident_node: dummyNode,
      facility_type: facilityType,
      nearest_facility: null,
      shortest_path: null,
      backup_path: null,
      all_facilities_evaluated: [],
      message: `Incident node '${incidentNodeId}' does not exist in graph.`,
    };
  }

  const matchingFacilities: Node[] = [];
  for (const node of graph.nodes.values()) {
    if (node.type === facilityType) {
      matchingFacilities.push(node);
    }
  }

  if (matchingFacilities.length === 0) {
    return {
      incident_node: incidentNode,
      facility_type: facilityType,
      nearest_facility: null,
      shortest_path: null,
      backup_path: null,
      all_facilities_evaluated: [],
      message: `No facilities of type '${facilityType}' found in current city graph.`,
    };
  }

  const facilityEvaluations: NearestFacilityResponse["all_facilities_evaluated"] = [];
  let bestFacility: Node | null = null;
  let bestPath: PathResponse | null = null;
  let bestCost = Infinity;

  for (const facility of matchingFacilities) {
    const pathRes = runDijkstra(graph, facility.id, incidentNodeId, true);
    if (pathRes.found) {
      facilityEvaluations.push({
        facility_id: facility.id,
        name: facility.name,
        distance_km: pathRes.total_distance_km,
        travel_time_minutes: pathRes.estimated_time_minutes,
        path: pathRes.path,
        reachable: true,
      });

      if (pathRes.total_cost < bestCost) {
        bestCost = pathRes.total_cost;
        bestFacility = facility;
        bestPath = pathRes;
      }
    } else {
      facilityEvaluations.push({
        facility_id: facility.id,
        name: facility.name,
        distance_km: null,
        travel_time_minutes: null,
        path: [],
        reachable: false,
      });
    }
  }

  facilityEvaluations.sort((a, b) => {
    const timeA = a.travel_time_minutes ?? Infinity;
    const timeB = b.travel_time_minutes ?? Infinity;
    return timeA - timeB;
  });

  if (!bestFacility || !bestPath) {
    return {
      incident_node: incidentNode,
      facility_type: facilityType,
      nearest_facility: null,
      shortest_path: null,
      backup_path: null,
      all_facilities_evaluated: facilityEvaluations,
      message: `None of the ${matchingFacilities.length} ${facilityType} facilities can reach '${incidentNode.name}' (roads blocked or disconnected).`,
    };
  }

  const backupPath = findAlternatePath(
    graph,
    bestFacility.id,
    incidentNodeId,
    bestPath
  );

  const humanType = facilityType.replace("_", " ");
  const message = `Fastest ${humanType} is '${bestFacility.name}' (${bestFacility.id}) — Estimated dispatch time: ${bestPath.estimated_time_minutes.toFixed(1)} mins (${bestPath.total_distance_km.toFixed(1)} km).`;

  return {
    incident_node: incidentNode,
    facility_type: facilityType,
    nearest_facility: bestFacility,
    shortest_path: bestPath,
    backup_path: backupPath,
    all_facilities_evaluated: facilityEvaluations,
    message,
  };
}

