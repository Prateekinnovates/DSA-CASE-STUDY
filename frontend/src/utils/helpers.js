export const NODE_TYPES = {
  hospital: {
    label: "Hospital",
    color: "#ef4444",
    bg: "bg-red-500/20",
    border: "border-red-500",
    text: "text-red-400",
    icon: "Hospital",
    emoji: "🏥"
  },
  fire_station: {
    label: "Fire Station",
    color: "#f97316",
    bg: "bg-orange-500/20",
    border: "border-orange-500",
    text: "text-orange-400",
    icon: "Flame",
    emoji: "🚒"
  },
  police_station: {
    label: "Police Station",
    color: "#3b82f6",
    bg: "bg-blue-500/20",
    border: "border-blue-500",
    text: "text-blue-400",
    icon: "Shield",
    emoji: "🚓"
  },
  junction: {
    label: "Junction",
    color: "#06b6d4",
    bg: "bg-cyan-500/20",
    border: "border-cyan-500",
    text: "text-cyan-400",
    icon: "CircleDot",
    emoji: "🌐"
  },
  accident: {
    label: "Accident / Incident",
    color: "#dc2626",
    bg: "bg-rose-500/20",
    border: "border-rose-500",
    text: "text-rose-400",
    icon: "AlertOctagon",
    emoji: "⚠️"
  }
};

export function formatMinutes(mins) {
  if (mins === undefined || mins === null) return "--";
  if (mins < 1) {
    return `${Math.round(mins * 60)}s`;
  }
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatDistance(km) {
  if (km === undefined || km === null) return "--";
  return `${km.toFixed(2)} km`;
}

export function getTrafficDescription(multiplier) {
  if (multiplier <= 1.0) return { label: "Free Flow", color: "text-emerald-400", hex: "#10b981" };
  if (multiplier <= 1.3) return { label: "Light Traffic", color: "text-yellow-400", hex: "#eab308" };
  if (multiplier <= 1.8) return { label: "Moderate Congestion", color: "text-amber-500", hex: "#f59e0b" };
  return { label: "Heavy Gridlock", color: "text-red-500", hex: "#ef4444" };
}

