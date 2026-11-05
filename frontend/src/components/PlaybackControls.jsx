import React from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

export default function PlaybackControls({
  isPlaying,
  currentStepIndex,
  totalSteps,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  speed,
  onSpeedChange
}) {
  if (totalSteps <= 0) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Algorithm Execution Trace
        </span>
        <span className="font-mono text-slate-400 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
          Step <strong className="text-emerald-400">{currentStepIndex + 1}</strong> of {totalSteps}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-1.5 rounded-full transition-all duration-150"
          style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            disabled={currentStepIndex <= 0}
            title="Step Backward"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition active:scale-95"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPause}
              title="Pause Execution"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1 text-xs transition active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={currentStepIndex >= totalSteps - 1}
              title="Play Trace"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1 text-xs transition active:scale-95 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>
          )}

          <button
            onClick={onNext}
            disabled={currentStepIndex >= totalSteps - 1}
            title="Step Forward"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            title="Reset to Step 1"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value={1500}>0.5x</option>
            <option value={800}>1.0x</option>
            <option value={400}>2.0x</option>
            <option value={200}>4.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
}

