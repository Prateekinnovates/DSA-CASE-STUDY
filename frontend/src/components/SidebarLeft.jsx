import React from "react";
import {
  Siren,
  Flame,
  Shield,
  Navigation,
  ArrowRightLeft,
  Zap,
  Play,
  RotateCcw,
  PlusCircle,
  Link,
  ShieldAlert,
  Sliders,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { NODE_TYPES } from "../utils/helpers";

export default function SidebarLeft({
  graph,
  selectedEmergency,
  onSelectEmergency,
  onDispatchNearest,
  sourceNode,
  onSourceChange,
  destNode,
  onDestChange,
  onSwapNodes,
  algorithm,
  onAlgorithmChange,
  onFindRoute,
  onCompare,
  onClearRoute,
  interactionMode,
  onSetInteractionMode,
  isComputing,
  hasActiveRoute
}) {
  const emergencyOptions = [
    {
      id: "ambulance",
      label: "Ambulance",
      facilityType: "hospital",
      icon: Siren,
      color: "from-red-500 to-rose-600",
      activeBorder: "border-red-500",
      description: "Dispatch fastest paramedic unit to accident"
    },
    {
      id: "fire_truck",
      label: "Fire Truck",
      facilityType: "fire_station",
      icon: Flame,
      color: "from-orange-500 to-amber-600",
      activeBorder: "border-orange-500",
      description: "Heavy structural firefighting response"
    },
    {
      id: "police",
      label: "Police Cruiser",
      facilityType: "police_station",
      icon: Shield,
      color: "from-blue-500 to-indigo-600",
      activeBorder: "border-blue-500",
      description: "Rapid tactical law enforcement intervention"
    }
  ];

  const algorithmOptions = [
    {
      id: "dijkstra",
      name: "Dijkstra's Algorithm",
      complexity: "O((V + E) log V)",
      tag: "Min-Heap",
      description: "Guaranteed optimal with non-negative edge costs"
    },
    {
      id: "astar",
      name: "A* Search Heuristic",
      complexity: "O(E) ~ O(V log V)",
      tag: "Haversine",
      description: "Directionally guided by admissible straight-line distance"
    },
    {
      id: "bellman_ford",
      name: "Bellman-Ford",
      complexity: "O(V * E)",
      tag: "Iterative Passes",
      description: "Handles dynamic weights & negative cycle verification"
    }
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-[#0f172a]/95 border-r border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 select-none">
      
      {/* 1. Emergency Scenario Quick Dispatch */}
      <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-300">
            <Siren className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Emergency Scenario</span>
          </div>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-semibold">
            Multi-Source
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {emergencyOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedEmergency === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectEmergency(opt.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                  isSelected
                    ? `bg-gradient-to-b ${opt.color} text-white ${opt.activeBorder} shadow-lg shadow-red-500/10 font-bold`
                    : "bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span className="text-[11px] leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dispatch Nearest Facility Button */}
        <button
          type="button"
          onClick={onDispatchNearest}
          disabled={isComputing}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-current text-yellow-300" />
          <span>Auto-Find Nearest Facility</span>
        </button>
      </div>

      {/* 2. Route Origin & Destination */}
      <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-300">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Route Endpoints</span>
          </div>
          <button
            onClick={onSwapNodes}
            title="Swap Source and Destination"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
              Origin (Source Station / Junction)
            </label>
            <select
              value={sourceNode}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {graph.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {NODE_TYPES[n.type]?.emoji || "📍"} [{n.id}] {n.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
              Destination (Incident / Hospital)
            </label>
            <select
              value={destNode}
              onChange={(e) => onDestChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {graph.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {NODE_TYPES[n.type]?.emoji || "📍"} [{n.id}] {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Shortest Path Algorithm Selection */}
      <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Algorithm</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Scratch DSA</span>
        </div>

        <div className="space-y-1.5">
          {algorithmOptions.map((algo) => {
            const isSelected = algorithm === algo.id;
            return (
              <div
                key={algo.id}
                onClick={() => onAlgorithmChange(algo.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                  isSelected
                    ? "bg-slate-800 border-blue-500/80 shadow-md"
                    : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-400"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                      {algo.name}
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                      {algo.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {algo.description}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {algo.complexity}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action button row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onFindRoute}
            disabled={isComputing}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Compute Path</span>
          </button>

          <button
            type="button"
            onClick={onCompare}
            disabled={isComputing}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Compare 3</span>
          </button>
        </div>

        {hasActiveRoute && (
          <button
            type="button"
            onClick={onClearRoute}
            className="w-full py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[11px] flex items-center justify-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Active Route</span>
          </button>
        )}
      </div>

      {/* 4. Graph Builder Tools & Mode */}
      <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-300">
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Map Tools</span>
          </div>
          <span className="text-[10px] text-slate-500">Interactive Canvas</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onSetInteractionMode("select")}
            className={`p-2 rounded-xl border flex items-center gap-1.5 font-medium transition ${
              interactionMode === "select"
                ? "bg-blue-600/30 border-blue-500 text-white font-bold shadow-md"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>👆</span>
            <span>Select / Move</span>
          </button>

          <button
            type="button"
            onClick={() => onSetInteractionMode("add_node")}
            className={`p-2 rounded-xl border flex items-center gap-1.5 font-medium transition ${
              interactionMode === "add_node"
                ? "bg-cyan-600/30 border-cyan-500 text-cyan-200 font-bold shadow-md animate-pulse"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>➕</span>
            <span>Add Node</span>
          </button>

          <button
            type="button"
            onClick={() => onSetInteractionMode("add_edge")}
            className={`p-2 rounded-xl border flex items-center gap-1.5 font-medium transition ${
              interactionMode === "add_edge"
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold shadow-md animate-pulse"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Connect Road</span>
          </button>

          <button
            type="button"
            onClick={() => onSetInteractionMode("block_road")}
            className={`p-2 rounded-xl border flex items-center gap-1.5 font-medium transition ${
              interactionMode === "block_road"
                ? "bg-red-600/30 border-red-500 text-red-300 font-bold shadow-md animate-pulse"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Toggle Block</span>
          </button>
        </div>

        {interactionMode !== "select" && (
          <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>
              {interactionMode === "add_node" && "Click anywhere on the map to place a new facility or junction."}
              {interactionMode === "add_edge" && "Click the first node, then the second node to create a road."}
              {interactionMode === "block_road" && "Click any road line on the map to toggle open / blocked."}
            </span>
          </div>
        )}
      </div>

    </aside>
  );
}

