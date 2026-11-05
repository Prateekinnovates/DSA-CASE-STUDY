import React, { useRef } from "react";
import { Siren, RefreshCw, Download, Upload, ShieldAlert, Activity } from "lucide-react";

export default function Navbar({
  graph,
  onResetGraph,
  onExportGraph,
  onImportGraph,
  isLoading
}) {
  const fileInputRef = useRef(null);

  const blockedCount = graph.edges.filter(e => e.status === "blocked").length;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.nodes && parsed.edges) {
          onImportGraph(parsed);
        } else {
          alert("Invalid graph JSON format. Must contain 'nodes' and 'edges' arrays.");
        }
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Emergency Emblem */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-blue-600 shadow-lg shadow-red-500/20">
          <Siren className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Route-O-Rescue
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              DISPATCH ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Shortest Path & Real-Time Emergency Graph Routing
          </p>
        </div>
      </div>

      {/* Network Live Stats */}
      <div className="hidden md:flex items-center gap-4 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nodes: <strong className="text-white">{graph.nodes.length}</strong></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span>Roads: <strong className="text-white">{graph.edges.length}</strong></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <ShieldAlert className={`w-3.5 h-3.5 ${blockedCount > 0 ? "text-red-400 animate-bounce" : "text-emerald-400"}`} />
          <span>Blocked: <strong className={blockedCount > 0 ? "text-red-400" : "text-emerald-400"}>{blockedCount}</strong></span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onResetGraph}
          disabled={isLoading}
          title="Reset to default 24-node Metro City grid"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Reset Preset</span>
        </button>

        <button
          onClick={onExportGraph}
          title="Export graph as JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import graph JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Import</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>
    </header>
  );
}

