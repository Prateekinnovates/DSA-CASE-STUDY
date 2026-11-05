import React, { useState } from "react";
import {
  Route,
  Activity,
  Layers,
  Clock,
  Navigation,
  ListOrdered,
  Zap,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import PlaybackControls from "./PlaybackControls";
import ComparisonChart from "./ComparisonChart";
import { formatMinutes, formatDistance, NODE_TYPES } from "../utils/helpers";

export default function SidebarRight({
  activeRoute,
  backupRoute,
  currentStep,
  currentStepIndex,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  speed,
  onSpeedChange,
  comparisonData,
  onClose
}) {
  const [activeTab, setActiveTab] = useState("route"); // 'route' | 'analytics'

  const hasRoute = activeRoute && activeRoute.found;

  return (
    <aside className="w-full lg:w-88 xl:w-[26rem] bg-[#0f172a]/95 border-l border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 select-none">
      
      {/* Tab Switcher */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab("route")}
          className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === "route"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>Route & Playback</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === "analytics"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>DSA Analytics</span>
        </button>
      </div>

      {activeTab === "route" ? (
        <div className="space-y-4">
          
          {/* Step-by-Step Playback Controls */}
          {totalSteps > 0 && (
            <PlaybackControls
              isPlaying={isPlaying}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              onPlay={onPlay}
              onPause={onPause}
              onNext={onNext}
              onPrev={onPrev}
              onReset={onReset}
              speed={speed}
              onSpeedChange={onSpeedChange}
            />
          )}

          {/* Current Algorithm Action / Message */}
          {currentStep && (
            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Algorithm State
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                  {currentStep.action.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                {currentStep.message}
              </p>

              {/* Edge relaxation details if active */}
              {currentStep.edge_relaxed && (
                <div className="text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-amber-300 flex items-center justify-between font-mono">
                  <span>Relaxing {currentStep.edge_relaxed.source} ➔ {currentStep.edge_relaxed.target}</span>
                  <span>Cost: {currentStep.edge_relaxed.weight}m</span>
                </div>
              )}
            </div>
          )}

          {/* Live Priority Queue / Min-Heap Frontier Inspector */}
          {currentStep && currentStep.frontier && currentStep.frontier.length > 0 && (
            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Priority Queue / Frontier ({currentStep.frontier.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Min-Heap State</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {currentStep.frontier.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 font-mono"
                  >
                    <span className="text-white font-bold">{item.item}</span>
                    <span className="text-amber-400 font-bold">{item.priority.toFixed(2)} mins</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Route Summary */}
          {hasRoute ? (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Shortest Route Found
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {activeRoute.algorithm.toUpperCase()}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Travel Time</div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                    {formatMinutes(activeRoute.estimated_time_minutes)}
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Distance</div>
                  <div className="text-base font-extrabold text-blue-400 font-mono mt-0.5">
                    {formatDistance(activeRoute.total_distance_km)}
                  </div>
                </div>
              </div>

              {/* Node Sequence */}
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <ListOrdered className="w-3 h-3 text-cyan-400" />
                  <span>Turn-by-Turn Route ({activeRoute.path.length} vertices)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                  {activeRoute.path.map((nodeId, idx) => (
                    <React.Fragment key={nodeId}>
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md text-xs font-mono font-bold text-slate-200 border border-slate-700">
                        {nodeId}
                      </span>
                      {idx < activeRoute.path.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Backup Route Section */}
              {backupRoute && backupRoute.found && (
                <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Backup Alternate Route
                    </span>
                    <span className="text-[10px] font-mono text-purple-400">
                      +{Math.max(0, (backupRoute.estimated_time_minutes - activeRoute.estimated_time_minutes)).toFixed(1)} mins
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between font-mono">
                    <span>{backupRoute.path.join(" ➔ ")}</span>
                    <span className="font-bold text-purple-300">{formatMinutes(backupRoute.estimated_time_minutes)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : activeRoute && !activeRoute.found ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <div className="text-sm font-bold text-red-300">No Passable Route Found</div>
              <p className="text-xs text-slate-300">
                {activeRoute.error_message || "All viable connecting roads are currently blocked or disconnected."}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
              <Navigation className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">No Active Route Selected</div>
              <p className="text-[11px] text-slate-400">
                Select an emergency scenario or pick source & destination to compute optimal dispatch paths.
              </p>
            </div>
          )}

        </div>
      ) : (
        /* Analytics Tab */
        <div className="space-y-4">
          <ComparisonChart comparisonData={comparisonData} />

          {/* Time & Space Complexity Cards */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Algorithm Complexity Guide
            </h4>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-blue-400">Dijkstra's Algorithm</strong>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    O((V + E) log V)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Binary min-heap priority queue ensures efficient vertex extraction. Optimal for non-negative road weights.
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-emerald-400">A* Search Heuristic</strong>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    O(E) ~ O(V log V)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Admissible Haversine straight-line distance heuristic steers search toward the target, visiting substantially fewer vertices.
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-purple-400">Bellman-Ford Algorithm</strong>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    O(V * E)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Iteratively relaxes all edges |V|-1 times. Detects negative cycles and handles dynamic road penalty models.
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-rose-400">Multi-Source Dijkstra</strong>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    O((V + E) log V)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Evaluates all nearby emergency facilities simultaneously to dispatch the closest response unit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}

