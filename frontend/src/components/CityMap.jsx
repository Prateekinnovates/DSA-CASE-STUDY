import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NODE_TYPES, formatMinutes, formatDistance, getTrafficDescription } from "../utils/helpers";
import Legend from "./Legend";

export default function CityMap({
  graph,
  activeRoute,
  backupRoute,
  currentStep,
  selectedEmergency,
  interactionMode,
  onNodeClick,
  onMapClick,
  onEdgeClick,
  onNodeDragEnd,
  sourceNode,
  destNode,
  onSetSource,
  onSetDest,
  onEditNode,
  onDeleteNode,
  onEditEdge
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    edges: L.layerGroup(),
    nodes: L.layerGroup(),
    shortestPath: L.layerGroup(),
    backupPath: L.layerGroup(),
    stepHighlight: L.layerGroup(),
    vehicle: L.layerGroup(),
  });

  const [vehiclePosition, setVehiclePosition] = useState(null);
  const animationFrameRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [40.745, -73.985],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // CartoDB Dark Matter Tiles (reliable high contrast dark map)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd"
      }).addTo(map);

      // Add layer groups
      Object.values(layersRef.current).forEach((layer) => layer.addTo(map));

      // Click on map container
      map.on("click", (e) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update bounds when graph loads or resets
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || graph.nodes.length === 0) return;

    const latLngs = graph.nodes.map((n) => [n.lat, n.lng]);
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [graph.nodes.length]);

  // Render Edges
  useEffect(() => {
    const layer = layersRef.current.edges;
    layer.clearLayers();

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    graph.edges.forEach((edge) => {
      const u = nodeMap.get(edge.source);
      const v = nodeMap.get(edge.target);
      if (!u || !v) return;

      const isBlocked = edge.status === "blocked";
      const traffic = getTrafficDescription(edge.traffic_multiplier);

      const color = isBlocked ? "#ef4444" : traffic.hex;
      const weight = isBlocked ? 4 : 3;
      const dashArray = isBlocked ? "6, 8" : undefined;
      const opacity = isBlocked ? 0.9 : 0.75;

      const polyline = L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
        color,
        weight,
        dashArray,
        opacity,
        smoothFactor: 1
      });

      const tooltipContent = `
        <div style="font-family: inherit; font-size: 11px; padding: 4px;">
          <div style="font-weight: bold; color: ${color};">${isBlocked ? "⛔ ROAD BLOCKED" : "🟢 ROAD OPEN"}</div>
          <div><strong>${u.id}</strong> ➔ <strong>${v.id}</strong></div>
          <div>Distance: <strong>${edge.distance_km} km</strong></div>
          <div>Traffic Factor: <strong>${edge.traffic_multiplier}x</strong> (${traffic.label})</div>
          <div>Speed Limit: <strong>${edge.max_speed_kmh} km/h</strong></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Click to toggle block / edit road</div>
        </div>
      `;
      polyline.bindTooltip(tooltipContent, { sticky: true, opacity: 0.95 });

      polyline.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onEdgeClick(edge);
      });

      polyline.addTo(layer);
    });
  }, [graph.edges, graph.nodes, onEdgeClick]);

  // Render Nodes
  useEffect(() => {
    const layer = layersRef.current.nodes;
    layer.clearLayers();

    graph.nodes.forEach((node) => {
      const meta = NODE_TYPES[node.type] || NODE_TYPES.junction;
      const isSource = sourceNode === node.id;
      const isDest = destNode === node.id;

      // Status rings for algorithm step playback
      const isVisited = currentStep?.visited_nodes?.includes(node.id);
      const isCurrent = currentStep?.current_node === node.id;
      const isFrontier = currentStep?.frontier?.some((f) => f.item === node.id);

      let ringClass = "";
      if (isCurrent) {
        ringClass = "ring-4 ring-cyan-400 animate-pulse-fast";
      } else if (isFrontier) {
        ringClass = "ring-4 ring-amber-400";
      } else if (isVisited) {
        ringClass = "ring-2 ring-blue-500/80";
      }

      let endpointBadge = "";
      if (isSource) {
        endpointBadge = `<span class="absolute -top-2.5 -left-2 bg-blue-500 text-white font-extrabold text-[9px] px-1 rounded shadow">START</span>`;
      } else if (isDest) {
        endpointBadge = `<span class="absolute -top-2.5 -right-2 bg-red-500 text-white font-extrabold text-[9px] px-1 rounded shadow">DEST</span>`;
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group select-none">
          ${endpointBadge}
          <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xl transition transform group-hover:scale-110 ${ringClass}"
               style="background: ${meta.color}; border: 2px solid #0f172a;">
            <span>${meta.emoji}</span>
          </div>
          <div class="absolute -bottom-4 bg-slate-900/90 text-[10px] font-mono font-bold text-slate-200 px-1.5 py-0.2 rounded border border-slate-700 shadow whitespace-nowrap">
            ${node.id}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-node-icon",
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([node.lat, node.lng], {
        icon: customIcon,
        draggable: interactionMode === "select"
      });

      marker.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        onNodeDragEnd(node.id, lat, lng);
      });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onNodeClick(node);
      });

      // Node popup with rapid routing triggers
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 180px;">
          <div style="font-weight: 800; font-size: 13px; color: ${meta.color}; display: flex; align-items: center; gap: 4px;">
            <span>${meta.emoji}</span>
            <span>${node.name} (${node.id})</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin: 4px 0;">${node.description || meta.label}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">Lat: ${node.lat.toFixed(4)}, Lng: ${node.lng.toFixed(4)}</div>
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            <button id="btn-src-${node.id}" style="flex: 1; background: #2563eb; color: white; border: none; border-radius: 6px; padding: 4px; font-weight: bold; font-size: 10px; cursor: pointer;">
              Set Origin
            </button>
            <button id="btn-dst-${node.id}" style="flex: 1; background: #dc2626; color: white; border: none; border-radius: 6px; padding: 4px; font-weight: bold; font-size: 10px; cursor: pointer;">
              Set Destination
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btnSrc = document.getElementById(`btn-src-${node.id}`);
        const btnDst = document.getElementById(`btn-dst-${node.id}`);
        if (btnSrc) {
          btnSrc.onclick = () => {
            onSetSource(node.id);
            marker.closePopup();
          };
        }
        if (btnDst) {
          btnDst.onclick = () => {
            onSetDest(node.id);
            marker.closePopup();
          };
        }
      });

      marker.addTo(layer);
    });
  }, [graph.nodes, sourceNode, destNode, currentStep, interactionMode, onNodeClick, onNodeDragEnd, onSetSource, onSetDest]);

  // Render Shortest Path & Backup Path
  useEffect(() => {
    const spLayer = layersRef.current.shortestPath;
    const bpLayer = layersRef.current.backupPath;
    spLayer.clearLayers();
    bpLayer.clearLayers();

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    // 1. Backup Alternate Path (violet dashed line underneath)
    if (backupRoute && backupRoute.found && backupRoute.path.length > 1) {
      const backupCoords = backupRoute.path
        .map((id) => nodeMap.get(id))
        .filter(Boolean)
        .map((n) => [n.lat, n.lng]);

      if (backupCoords.length > 1) {
        L.polyline(backupCoords, {
          color: "#a855f7",
          weight: 5,
          dashArray: "8, 10",
          opacity: 0.85
        })
          .bindTooltip(
            `<div style="font-size: 11px;"><strong>Backup Route</strong>: ${backupRoute.estimated_time_minutes} mins</div>`,
            { sticky: true }
          )
          .addTo(bpLayer);
      }
    }

    // 2. Primary Shortest Path (glowing emerald line)
    if (activeRoute && activeRoute.found && activeRoute.path.length > 1) {
      const pathCoords = activeRoute.path
        .map((id) => nodeMap.get(id))
        .filter(Boolean)
        .map((n) => [n.lat, n.lng]);

      if (pathCoords.length > 1) {
        // Glowing shadow outline
        L.polyline(pathCoords, {
          color: "#059669",
          weight: 10,
          opacity: 0.4
        }).addTo(spLayer);

        // Solid bright neon core
        L.polyline(pathCoords, {
          color: "#10b981",
          weight: 5,
          opacity: 0.95
        })
          .bindTooltip(
            `<div style="font-size: 11px;"><strong>Shortest Route</strong>: ${activeRoute.estimated_time_minutes} mins (${activeRoute.total_distance_km} km)</div>`,
            { sticky: true }
          )
          .addTo(spLayer);
      }
    }
  }, [activeRoute, backupRoute, graph.nodes]);

  // Render Step Relaxed Edge Highlight during animation
  useEffect(() => {
    const layer = layersRef.current.stepHighlight;
    layer.clearLayers();

    if (currentStep?.edge_relaxed) {
      const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
      const u = nodeMap.get(currentStep.edge_relaxed.source);
      const v = nodeMap.get(currentStep.edge_relaxed.target);
      if (u && v) {
        L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
          color: "#facc15",
          weight: 6,
          dashArray: "4, 6",
          opacity: 0.95
        }).addTo(layer);
      }
    }
  }, [currentStep, graph.nodes]);

  // Animated Vehicle Marker travelling along route
  useEffect(() => {
    const vehicleLayer = layersRef.current.vehicle;
    vehicleLayer.clearLayers();

    if (!activeRoute || !activeRoute.found || activeRoute.path.length < 2) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    const coords = activeRoute.path
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .map((n) => [n.lat, n.lng]);

    if (coords.length < 2) return;

    let vehicleEmoji = "🚑";
    let vehicleTitle = "Ambulance #1";
    if (selectedEmergency === "fire_truck") {
      vehicleEmoji = "🚒";
      vehicleTitle = "Fire Engine #4";
    } else if (selectedEmergency === "police") {
      vehicleEmoji = "🚓";
      vehicleTitle = "Patrol Unit #9";
    }

    const vehicleIcon = L.divIcon({
      className: "emergency-vehicle-marker",
      html: `
        <div class="relative flex items-center justify-center select-none">
          <span class="absolute w-10 h-10 rounded-full bg-red-500/40 animate-ping"></span>
          <div class="w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center text-lg z-10 transform scale-105">
            ${vehicleEmoji}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker(coords[0], { icon: vehicleIcon }).addTo(vehicleLayer);
    marker.bindTooltip(`<strong>${vehicleTitle}</strong> (En-Route)`, { permanent: false });

    // Smooth movement along polyline
    let currentSegment = 0;
    let progress = 0;
    const speedFactor = 0.008; // smooth step size

    const animate = () => {
      progress += speedFactor;
      if (progress >= 1.0) {
        progress = 0;
        currentSegment++;
        if (currentSegment >= coords.length - 1) {
          currentSegment = 0; // loop animation
        }
      }

      const p1 = coords[currentSegment];
      const p2 = coords[currentSegment + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * progress;
      const lng = p1[1] + (p2[1] - p1[1]) * progress;

      marker.setLatLng([lat, lng]);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeRoute, selectedEmergency, graph.nodes]);

  return (
    <div className="relative w-full h-full flex-1 bg-[#090d16] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Legend */}
      <Legend />

      {/* Mode Indicator Overlay */}
      {interactionMode !== "select" && (
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
          <span className="font-bold text-white">
            {interactionMode === "add_node" && "Mode: Click anywhere on map to add node"}
            {interactionMode === "add_edge" && "Mode: Click 2 nodes sequentially to connect road"}
            {interactionMode === "block_road" && "Mode: Click any road line to toggle block / unblock"}
          </span>
        </div>
      )}
    </div>
  );
}

