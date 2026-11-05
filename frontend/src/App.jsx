import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import SidebarLeft from "./components/SidebarLeft";
import CityMap from "./components/CityMap";
import SidebarRight from "./components/SidebarRight";
import NodeModal from "./components/NodeModal";
import EdgeModal from "./components/EdgeModal";
import { DEFAULT_GRAPH_DATA } from "./utils/sampleData";
import * as api from "./services/api";

export default function App() {
  const [graph, setGraph] = useState(DEFAULT_GRAPH_DATA);
  const [sourceNode, setSourceNode] = useState("F1");
  const [destNode, setDestNode] = useState("A1");
  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [selectedEmergency, setSelectedEmergency] = useState("fire_truck");
  const [interactionMode, setInteractionMode] = useState("select");

  const [activeRoute, setActiveRoute] = useState(null);
  const [backupRoute, setBackupRoute] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  // Step-by-step playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(800);

  // Modals state
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [nodeModalData, setNodeModalData] = useState(null);
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [edgeModalData, setEdgeModalData] = useState(null);
  const [edgeSourceNode, setEdgeSourceNode] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const playbackTimerRef = useRef(null);

  // Initial load: sync graph with backend API if accessible
  useEffect(() => {
    async function loadServerGraph() {
      try {
        setIsLoading(true);
        const data = await api.fetchGraph();
        if (data && data.nodes && data.nodes.length > 0) {
          setGraph(data);
        }
      } catch (err) {
        console.warn("Backend API not reachable yet, using built-in sample city dataset:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadServerGraph();
  }, []);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && activeRoute && activeRoute.steps && activeRoute.steps.length > 0) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= activeRoute.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, activeRoute, playbackSpeed]);

  // Compute Shortest Path
  const handleFindRoute = async (customSource = null, customDest = null) => {
    const src = customSource || sourceNode;
    const dst = customDest || destNode;

    if (src === dst) {
      alert("Origin and destination must be different nodes.");
      return;
    }

    try {
      setIsLoading(true);
      setIsPlaying(false);

      // Primary Route
      const res = await api.computeShortestPath({
        source: src,
        destination: dst,
        algorithm,
        graph,
        include_steps: true
      });

      setActiveRoute(res);
      setCurrentStepIndex(res.steps?.length ? res.steps.length - 1 : 0);

      // Try computing backup alternate route
      try {
        // Run comparison to also feed analytics tab
        const comp = await api.compareAlgorithms({
          source: src,
          destination: dst,
          graph
        });
        setComparisonData(comp);
      } catch (e) {
        console.warn("Comparison fetch failed:", e);
      }
    } catch (err) {
      alert("Error finding shortest path: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Emergency Scenario: Auto-find Nearest Facility
  const handleDispatchNearest = async () => {
    let facilityType = "hospital";
    if (selectedEmergency === "fire_truck") facilityType = "fire_station";
    else if (selectedEmergency === "police") facilityType = "police_station";

    // Destination is the incident node (e.g. A1 or currently selected dest)
    let incidentId = destNode;
    const incidentNodeObj = graph.nodes.find((n) => n.id === incidentId);
    if (!incidentNodeObj || incidentNodeObj.type !== "accident") {
      // Pick the first accident node if current dest is not an accident
      const firstAccident = graph.nodes.find((n) => n.type === "accident");
      if (firstAccident) {
        incidentId = firstAccident.id;
        setDestNode(firstAccident.id);
      }
    }

    try {
      setIsLoading(true);
      setIsPlaying(false);

      const res = await api.findNearestFacility({
        incident_node_id: incidentId,
        facility_type: facilityType,
        algorithm,
        graph
      });

      if (res.nearest_facility && res.shortest_path) {
        setSourceNode(res.nearest_facility.id);
        setDestNode(incidentId);
        setActiveRoute(res.shortest_path);
        setBackupRoute(res.backup_path || null);
        setCurrentStepIndex(res.shortest_path.steps?.length ? res.shortest_path.steps.length - 1 : 0);
      } else {
        alert(res.message || "No reachable facility found.");
      }
    } catch (err) {
      alert("Emergency dispatch failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Compare all 3 algorithms
  const handleCompare = async () => {
    try {
      setIsLoading(true);
      const res = await api.compareAlgorithms({
        source: sourceNode,
        destination: destNode,
        graph
      });
      setComparisonData(res);
      // Also set active route to selected algorithm
      if (res[algorithm]) {
        setActiveRoute(res[algorithm]);
        setCurrentStepIndex(res[algorithm].steps?.length ? res[algorithm].steps.length - 1 : 0);
      }
    } catch (err) {
      alert("Algorithm comparison failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Road Blockage & Dynamic Re-routing
  const handleToggleBlockRoad = async (edge) => {
    const nextStatus = edge.status === "blocked" ? "open" : "blocked";

    try {
      setIsLoading(true);
      const res = await api.toggleRoadBlockage({
        edge_id: edge.id,
        status: nextStatus,
        recompute: Boolean(activeRoute && activeRoute.found),
        active_source: sourceNode,
        active_destination: destNode,
        algorithm,
        graph
      });

      setGraph(res.graph);

      if (res.recomputed_path) {
        setActiveRoute(res.recomputed_path);
        setCurrentStepIndex(res.recomputed_path.steps?.length ? res.recomputed_path.steps.length - 1 : 0);
      }
    } catch (err) {
      alert("Failed to toggle road status: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Node Drag End (Update coordinates)
  const handleNodeDragEnd = (nodeId, lat, lng) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, lat, lng } : n))
    }));
  };

  // Map Click (Handle Add Node)
  const handleMapClick = (coords) => {
    if (interactionMode === "add_node") {
      setNodeModalData({
        isEdit: false,
        lat: coords.lat,
        lng: coords.lng
      });
      setIsNodeModalOpen(true);
    }
  };

  // Node Click (Handle mode actions or selection)
  const handleNodeClick = (node) => {
    if (interactionMode === "add_edge") {
      if (!edgeSourceNode) {
        setEdgeSourceNode(node.id);
      } else if (edgeSourceNode !== node.id) {
        setEdgeModalData({
          isEdit: false,
          source: edgeSourceNode,
          target: node.id
        });
        setIsEdgeModalOpen(true);
        setEdgeSourceNode(null);
      }
    } else if (interactionMode === "select") {
      // If clicking node without origin set, set origin; if origin set, set dest
      if (!sourceNode) {
        setSourceNode(node.id);
      } else if (!destNode && node.id !== sourceNode) {
        setDestNode(node.id);
      }
    }
  };

  // Edge Click (Handle Block Road or Edit Road)
  const handleEdgeClick = (edge) => {
    if (interactionMode === "block_road") {
      handleToggleBlockRoad(edge);
    } else {
      setEdgeModalData({ ...edge, isEdit: true });
      setIsEdgeModalOpen(true);
    }
  };

  // Save Node from Modal
  const handleSaveNode = (nodeData) => {
    setGraph((prev) => {
      const exists = prev.nodes.some((n) => n.id === nodeData.id);
      const newNodes = exists
        ? prev.nodes.map((n) => (n.id === nodeData.id ? nodeData : n))
        : [...prev.nodes, nodeData];
      return { ...prev, nodes: newNodes };
    });
    setIsNodeModalOpen(false);
    setInteractionMode("select");
  };

  // Save Edge from Modal
  const handleSaveEdge = (edgeData) => {
    setGraph((prev) => {
      const exists = prev.edges.some((e) => e.id === edgeData.id);
      const newEdges = exists
        ? prev.edges.map((e) => (e.id === edgeData.id ? edgeData : e))
        : [...prev.edges, edgeData];
      return { ...prev, edges: newEdges };
    });
    setIsEdgeModalOpen(false);
    setInteractionMode("select");
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId)
    }));
    setIsEdgeModalOpen(false);
  };

  // Reset Graph to Preset
  const handleResetGraph = async () => {
    try {
      setIsLoading(true);
      const data = await api.resetGraphOnServer();
      setGraph(data);
      setActiveRoute(null);
      setBackupRoute(null);
      setComparisonData(null);
    } catch (err) {
      console.warn("Using default client preset:", err);
      setGraph(DEFAULT_GRAPH_DATA);
      setActiveRoute(null);
      setBackupRoute(null);
      setComparisonData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Export Graph JSON
  const handleExportGraph = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graph, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "route_o_rescue_metro_city.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Graph JSON
  const handleImportGraph = async (importedGraph) => {
    try {
      setIsLoading(true);
      const res = await api.saveGraphOnServer(importedGraph);
      setGraph(res);
      setActiveRoute(null);
      setBackupRoute(null);
    } catch (err) {
      setGraph(importedGraph);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = activeRoute?.steps?.[currentStepIndex] || null;
  const totalSteps = activeRoute?.steps?.length || 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        graph={graph}
        onResetGraph={handleResetGraph}
        onExportGraph={handleExportGraph}
        onImportGraph={handleImportGraph}
        isLoading={isLoading}
      />

      {/* Main 3-Column Workspace */}
      <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
        {/* Left Sidebar: Controls & Scenarios */}
        <SidebarLeft
          graph={graph}
          selectedEmergency={selectedEmergency}
          onSelectEmergency={setSelectedEmergency}
          onDispatchNearest={handleDispatchNearest}
          sourceNode={sourceNode}
          onSourceChange={setSourceNode}
          destNode={destNode}
          onDestChange={setDestNode}
          onSwapNodes={() => {
            const temp = sourceNode;
            setSourceNode(destNode);
            setDestNode(temp);
          }}
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          onFindRoute={() => handleFindRoute()}
          onCompare={handleCompare}
          onClearRoute={() => {
            setActiveRoute(null);
            setBackupRoute(null);
            setIsPlaying(false);
          }}
          interactionMode={interactionMode}
          onSetInteractionMode={(mode) => {
            setInteractionMode(mode);
            setEdgeSourceNode(null);
          }}
          isComputing={isLoading}
          hasActiveRoute={Boolean(activeRoute)}
        />

        {/* Center: Interactive City Map */}
        <CityMap
          graph={graph}
          activeRoute={activeRoute}
          backupRoute={backupRoute}
          currentStep={currentStep}
          selectedEmergency={selectedEmergency}
          interactionMode={interactionMode}
          onNodeClick={handleNodeClick}
          onMapClick={handleMapClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragEnd={handleNodeDragEnd}
          sourceNode={sourceNode}
          destNode={destNode}
          onSetSource={setSourceNode}
          onSetDest={setDestNode}
          onEditNode={(node) => {
            setNodeModalData({ ...node, isEdit: true });
            setIsNodeModalOpen(true);
          }}
          onDeleteNode={(nodeId) => {
            setGraph((prev) => ({
              ...prev,
              nodes: prev.nodes.filter((n) => n.id !== nodeId),
              edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
            }));
          }}
          onEditEdge={(edge) => {
            setEdgeModalData({ ...edge, isEdit: true });
            setIsEdgeModalOpen(true);
          }}
        />

        {/* Right Sidebar: Step Playback & Analytics */}
        <SidebarRight
          activeRoute={activeRoute}
          backupRoute={backupRoute}
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onNext={() => setCurrentStepIndex((p) => Math.min(totalSteps - 1, p + 1))}
          onPrev={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
          onReset={() => {
            setIsPlaying(false);
            setCurrentStepIndex(0);
          }}
          speed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          comparisonData={comparisonData}
        />
      </div>

      {/* Modals */}
      <NodeModal
        isOpen={isNodeModalOpen}
        onClose={() => setIsNodeModalOpen(false)}
        onSave={handleSaveNode}
        initialData={nodeModalData}
      />

      <EdgeModal
        isOpen={isEdgeModalOpen}
        onClose={() => setIsEdgeModalOpen(false)}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
        initialData={edgeModalData}
        nodes={graph.nodes}
      />
    </div>
  );
}

