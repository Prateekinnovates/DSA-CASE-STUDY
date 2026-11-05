import React, { useState } from "react";
import { Info, ChevronUp, ChevronDown } from "lucide-react";
import { NODE_TYPES } from "../utils/helpers";

export default function Legend() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="absolute bottom-5 right-5 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3 text-xs w-64 transition-all">
      <div 
        className="flex items-center justify-between cursor-pointer select-none pb-1"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Map & Graph Legend</span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2.5 pt-2 border-t border-slate-800">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nodes</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(NODE_TYPES).map(([type, meta]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="text-slate-300 truncate">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Routes & Status</div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-5 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]"></span>
                <span>Shortest Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-1 border-t-2 border-dashed border-purple-400"></span>
                <span>Backup Alternate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-1 border-t-2 border-dashed border-red-500"></span>
                <span>Blocked Road (⛔)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-1 bg-amber-400"></span>
                <span>Heavy Traffic (1.8x+)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

