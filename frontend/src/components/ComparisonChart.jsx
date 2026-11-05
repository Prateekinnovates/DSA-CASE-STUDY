import React, { useState } from "react";
import { Zap, Eye, Clock, CheckCircle2 } from "lucide-react";

export default function ComparisonChart({ comparisonData }) {
  const [metric, setMetric] = useState("nodes"); // 'nodes' | 'time'

  if (!comparisonData) return null;

  const { dijkstra, astar, bellman_ford, summary } = comparisonData;

  const algos = [
    {
      name: "Dijkstra",
      key: "dijkstra",
      nodes: dijkstra.nodes_visited_count,
      time: dijkstra.execution_time_ms,
      cost: dijkstra.total_cost,
      color: "from-blue-600 to-cyan-500",
      barColor: "#3b82f6",
      complexity: "O((V + E) log V)",
    },
    {
      name: "A* Search",
      key: "astar",
      nodes: astar.nodes_visited_count,
      time: astar.execution_time_ms,
      cost: astar.total_cost,
      color: "from-emerald-500 to-teal-400",
      barColor: "#10b981",
      complexity: "O(E) ~ O(V log V)",
    },
    {
      name: "Bellman-Ford",
      key: "bellman_ford",
      nodes: bellman_ford.nodes_visited_count,
      time: bellman_ford.execution_time_ms,
      cost: bellman_ford.total_cost,
      color: "from-purple-600 to-pink-500",
      barColor: "#a855f7",
      complexity: "O(V * E)",
    },
  ];

  const maxNodes = Math.max(...algos.map((a) => a.nodes), 1);
  const maxTime = Math.max(...algos.map((a) => a.time), 0.001);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Algorithm Performance Benchmark
          </h3>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
          <button
            onClick={() => setMetric("nodes")}
            className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
              metric === "nodes"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Nodes Visited</span>
          </button>
          <button
            onClick={() => setMetric("time")}
            className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
              metric === "time"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Exec Time (ms)</span>
          </button>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="space-y-3 pt-1">
        {algos.map((algo) => {
          const val = metric === "nodes" ? algo.nodes : algo.time;
          const maxVal = metric === "nodes" ? maxNodes : maxTime;
          const pct = Math.max(8, (val / maxVal) * 100);

          return (
            <div key={algo.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <span>{algo.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({algo.complexity})
                  </span>
                </div>
                <div className="font-mono text-slate-300 font-bold">
                  {metric === "nodes" ? `${algo.nodes} nodes` : `${algo.time.toFixed(3)} ms`}
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${algo.color} transition-all duration-500 shadow-sm`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary insights */}
      {summary && (
        <div className="bg-slate-800/70 rounded-lg p-2.5 border border-slate-700/60 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {summary.cost_match
                ? "All 3 algorithms verified to find the identical optimal path cost!"
                : "Results evaluated across current network."}
            </span>
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            • <strong>A* Search</strong> explores fewer vertices by utilizing the admissible Haversine heuristic.
            <br />
            • <strong>Dijkstra</strong> expands systematically in all directions using a Min-Heap.
            <br />
            • <strong>Bellman-Ford</strong> runs \(|V|-1\) edge relaxation passes, guaranteeing convergence and dynamic weight validation.
          </div>
        </div>
      )}
    </div>
  );
}

