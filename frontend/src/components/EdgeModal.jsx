import React, { useState } from "react";
import { X, Navigation, Trash2 } from "lucide-react";
import { getTrafficDescription } from "../utils/helpers";

export default function EdgeModal({ isOpen, onClose, onSave, onDelete, initialData, nodes }) {
  if (!isOpen) return null;

  const [id, setId] = useState(initialData?.id || `e_${Date.now().toString().slice(-4)}`);
  const [source, setSource] = useState(initialData?.source || nodes[0]?.id || "");
  const [target, setTarget] = useState(initialData?.target || nodes[1]?.id || "");
  const [distance, setDistance] = useState(initialData?.distance_km || 1.5);
  const [traffic, setTraffic] = useState(initialData?.traffic_multiplier || 1.0);
  const [status, setStatus] = useState(initialData?.status || "open");
  const [speed, setSpeed] = useState(initialData?.max_speed_kmh || 50);
  const [bidirectional, setBidirectional] = useState(initialData?.bidirectional !== false);

  const trafficInfo = getTrafficDescription(traffic);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (source === target) {
      alert("Source and target nodes must be different.");
      return;
    }
    onSave({
      id,
      source,
      target,
      distance_km: parseFloat(distance),
      traffic_multiplier: parseFloat(traffic),
      status,
      max_speed_kmh: parseFloat(speed),
      bidirectional
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {initialData?.isEdit ? "Edit Road Connection" : "Connect Nodes (Add Edge)"}
            </h3>
            <p className="text-xs text-slate-400">
              Configure road distance, traffic weight, and blockage status
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Source Node</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={initialData?.isEdit}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} - {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Node</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={initialData?.isEdit}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} - {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Speed Limit (km/h)</label>
              <input
                type="number"
                min="10"
                max="120"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Traffic Multiplier */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">
                Traffic Multiplier: <span className="font-mono text-white">{traffic}x</span>
              </label>
              <span className={`text-[11px] font-semibold ${trafficInfo.color}`}>
                {trafficInfo.label}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={traffic}
              onChange={(e) => setTraffic(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Road Status */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Road Condition</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("open")}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                  status === "open"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🟢 Road Open</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus("blocked")}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                  status === "blocked"
                    ? "bg-red-500/20 border-red-500 text-red-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>⛔ Road Blocked</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="bidi"
              checked={bidirectional}
              onChange={(e) => setBidirectional(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <label htmlFor="bidi" className="text-slate-300 cursor-pointer select-none">
              Bidirectional road (traffic moves both ways)
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            {initialData?.isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div></div>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
              >
                Save Road
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

