import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import SidebarLeft from "./components/SidebarLeft";
import CityMap from "./components/CityMap";
import SidebarRight from "./components/SidebarRight";
import NodeModal from "./components/NodeModal";
import EdgeModal from "./components/EdgeModal";
import sampleCityData from "./data/sample_city.json";
import {
  CityGraph,
  runDijkstra,
  runAStar,
  runBellmanFord,
  findNearestFacility,
  findAlternatePath,
  compareAlgorithms,
  blockRoadAndReroute
} from "./lib";

export default function App() {
  const [graph, setGraph] = useState(sampleCityData);
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

  // Compute Shortest Path directly using client-side TypeScript DSA algorithms
  const handleFindRoute = (customSource = null, customDest = null) => {
    const src = customSource || sourceNode;
    const dst = customDest || destNode;

    if (src === dst) {
      alert("Origin and destination must be different nodes.");
      return;
    }

    try {
      setIsLoading(true);
      setIsPlaying(false);

      const cityGraph = new CityGraph(graph);
      let res;

      if (algorithm === "astar") {
        res = runAStar(cityGraph, src, dst, true);
      } else if (algorithm === "bellman_ford") {
        res = runBellmanFord(cityGraph, src, dst, true);
      } else {
        res = runDijkstra(cityGraph, src, dst, true);
      }

      setActiveRoute(res);
      setCurrentStepIndex(res.steps?.length ? res.steps.length - 1 : 0);

      // Derive backup alternate route using Yen's edge-deviation algorithm
      const backup = findAlternatePath(cityGraph, src, dst, res);
      setBackupRoute(backup || null);

      // Run algorithm comparison to populate analytics tab
      const comp = compareAlgorithms(cityGraph, src, dst);
      setComparisonData(comp);
    } catch (err) {
      alert("Error finding shortest path: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Emergency Scenario: Auto-find Nearest Facility via Multi-Source Dijkstra
  const handleDispatchNearest = () => {
    let facilityType = "hospital";
    if (selectedEmergency === "fire_truck") facilityType = "fire_station";
    else if (selectedEmergency === "police") facilityType = "police_station";

    let incidentId = destNode;
    const incidentNodeObj = graph.nodes.find((n) => n.id === incidentId);
    if (!incidentNodeObj || incidentNodeObj.type !== "accident") {
      const firstAccident = graph.nodes.find((n) => n.type === "accident");
      if (firstAccident) {
        incidentId = firstAccident.id;
        setDestNode(firstAccident.id);
      }
    }

    try {
      setIsLoading(true);
      setIsPlaying(false);

      const cityGraph = new CityGraph(graph);
      const res = findNearestFacility(cityGraph, incidentId, facilityType, algorithm);

      if (res.nearest_facility && res.shortest_path) {
        setSourceNode(res.nearest_facility.id);
        setDestNode(incidentId);
        setActiveRoute(res.shortest_path);
        setBackupRoute(res.backup_path || null);
        setCurrentStepIndex(res.shortest_path.steps?.length ? res.shortest_path.steps.length - 1 : 0);

        // Update comparison data
        const comp = compareAlgorithms(cityGraph, res.nearest_facility.id, incidentId);
        setComparisonData(comp);
      } else {
        alert(res.message || "No reachable facility found.");
      }
    } catch (err) {
      alert("Emergency dispatch failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Compare all 3 algorithms (Dijkstra vs A* vs Bellman-Ford)
  const handleCompare = () => {
    try {
      setIsLoading(true);
      const cityGraph = new CityGraph(graph);
      const res = compareAlgorithms(cityGraph, sourceNode, destNode);
      setComparisonData(res);

      if (res[algorithm]) {
        setActiveRoute(res[algorithm]);
        const backup = findAlternatePath(cityGraph, sourceNode, destNode, res[algorithm]);
        setBackupRoute(backup || null);
        setCurrentStepIndex(res[algorithm].steps?.length ? res[algorithm].steps.length - 1 : 0);
      }
    } catch (err) {
      alert("Algorithm comparison failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Road Blockage & Dynamic Re-routing in client memory
  const handleToggleBlockRoad = (edge) => {
    const nextStatus = edge.status === "blocked" ? "open" : "blocked";

    try {
      setIsLoading(true);
      const cityGraph = new CityGraph(graph);
      const res = blockRoadAndReroute({
        graph: cityGraph,
        edgeId: edge.id,
        status: nextStatus,
        recompute: Boolean(activeRoute && activeRoute.found),
        activeSource: sourceNode,
        activeDestination: destNode,
        algorithm
      });

      setGraph(res.graph);

      if (res.recomputed_path) {
        setActiveRoute(res.recomputed_path);
        const backup = findAlternatePath(cityGraph, sourceNode, destNode, res.recomputed_path);
        setBackupRoute(backup || null);
        setCurrentStepIndex(res.recomputed_path.steps?.length ? res.recomputed_path.steps.length - 1 : 0);
      }
    } catch (err) {
      alert("Failed to toggle road status: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Node Drag End (Update coordinates in client state)
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

  // Reset Graph to Preset sample city JSON directly
  const handleResetGraph = () => {
    setGraph(JSON.parse(JSON.stringify(sampleCityData)));
    setActiveRoute(null);
    setBackupRoute(null);
    setComparisonData(null);
  };

  // Export Graph JSON in browser
  const handleExportGraph = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graph, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "route_o_rescue_metro_city.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Graph JSON directly in browser
  const handleImportGraph = (importedGraph) => {
    setGraph(importedGraph);
    setActiveRoute(null);
    setBackupRoute(null);
    setComparisonData(null);
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
