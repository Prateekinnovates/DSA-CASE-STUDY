/**
 * Graph representation and utilities for Route-O-Rescue.
 * Implemented in TypeScript without third-party graph libraries.
 */

import { Node, Edge, GraphData } from "./types";

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0.0, 1.0 - a)));
  return R * c;
}

export class CityGraph {
  public nodes: Map<string, Node> = new Map();
  public adj: Map<string, Array<{ target: string; edge: Edge }>> = new Map();
  public edges: Map<string, Edge> = new Map();

  constructor(data?: GraphData) {
    if (data) {
      this.loadFromData(data);
    }
  }

  loadFromData(data: GraphData): void {
    this.nodes.clear();
    this.adj.clear();
    this.edges.clear();

    for (const node of data.nodes) {
      this.addNode(node);
    }

    for (const edge of data.edges) {
      this.addEdge(edge);
    }
  }

  addNode(node: Node): void {
    this.nodes.set(node.id, { ...node });
    if (!this.adj.has(node.id)) {
      this.adj.set(node.id, []);
    }
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.adj.delete(nodeId);

    // Remove any outgoing edges pointing to this node
    for (const [u, neighbors] of this.adj.entries()) {
      this.adj.set(
        u,
        neighbors.filter((n) => n.target !== nodeId)
      );
    }

    // Clean edges registry
    for (const [eid, edge] of this.edges.entries()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        this.edges.delete(eid);
      }
    }
  }

  addEdge(edge: Edge): void {
    this.edges.set(edge.id, { ...edge });

    if (!this.adj.has(edge.source)) {
      this.adj.set(edge.source, []);
    }
    if (!this.adj.has(edge.target)) {
      this.adj.set(edge.target, []);
    }

    // Forward edge
    this.adj.get(edge.source)!.push({ target: edge.target, edge });

    // Reverse edge if bidirectional
    if (edge.bidirectional !== false) {
      this.adj.get(edge.target)!.push({ target: edge.source, edge });
    }
  }

  removeEdge(edgeId: string): void {
    this.edges.delete(edgeId);
    for (const [u, neighbors] of this.adj.entries()) {
      this.adj.set(
        u,
        neighbors.filter((n) => n.edge.id !== edgeId)
      );
    }
  }

  updateEdgeStatus(
    edgeId: string,
    status: "open" | "blocked",
    trafficMultiplier?: number | null
  ): Edge | null {
    const edge = this.edges.get(edgeId);
    if (!edge) return null;

    edge.status = status;
    if (trafficMultiplier !== undefined && trafficMultiplier !== null) {
      edge.traffic_multiplier = Math.max(1.0, Number(trafficMultiplier));
    }
    return edge;
  }

  getNeighbors(nodeId: string): Array<{ target: string; edge: Edge }> {
    return this.adj.get(nodeId) || [];
  }

  getEdgeWeight(edge: Edge): number {
    if (edge.status === "blocked") {
      return Infinity;
    }
    const speedKmh = Math.max(5.0, edge.max_speed_kmh / edge.traffic_multiplier);
    return (edge.distance_km / speedKmh) * 60.0;
  }

  getMaxSpeed(): number {
    if (this.edges.size === 0) return 80.0;
    let max = 50.0;
    for (const edge of this.edges.values()) {
      if (edge.max_speed_kmh > max) {
        max = edge.max_speed_kmh;
      }
    }
    return max;
  }

  heuristic(nodeAId: string, nodeBId: string): number {
    const na = this.nodes.get(nodeAId);
    const nb = this.nodes.get(nodeBId);
    if (!na || !nb) return 0.0;

    const distKm = haversineDistanceKm(na.lat, na.lng, nb.lat, nb.lng);
    const maxSpeed = this.getMaxSpeed();
    return (distKm / maxSpeed) * 60.0;
  }

  toGraphData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  clone(): CityGraph {
    return new CityGraph(JSON.parse(JSON.stringify(this.toGraphData())));
  }
}

