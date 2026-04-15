import { Avatar, Belt } from "@/types";

interface AvatarDisplayProps {
  belt: Belt;
  avatar: Avatar | null;
  name: string;
}

const BELT_BG_COLORS: Record<Belt, string> = {
  white: "from-gray-100 to-gray-300",
  blue: "from-blue-400 to-blue-600",
  purple: "from-purple-500 to-purple-700",
  brown: "from-amber-600 to-amber-800",
  black: "from-gray-700 to-gray-900",
};

const BELT_RING_COLORS: Record<Belt, string> = {
  white: "ring-gray-300",
  blue: "ring-blue-500",
  purple: "ring-purple-500",
  brown: "ring-amber-700",
  black: "ring-gray-900",
};

const BELT_STRIPE_FILL: Record<Belt, string> = {
  white: "#E5E7EB",
  blue: "#2563EB",
  purple: "#7C3AED",
  brown: "#92400E",
  black: "#111827",
};

const OUTFIT_LABEL: Record<string, string> = {
  default: "Iniciante",
  fighter: "Lutador",
  champion: "Campeão",
  legend: "Lenda",
};

export function AvatarDisplay({ belt, avatar, name }: AvatarDisplayProps) {
  const outfit = avatar?.outfit ?? "default";
  const level = avatar?.level ?? 1;
  const isLegend = outfit === "legend";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`w-28 h-28 rounded-full bg-gradient-to-br ${BELT_BG_COLORS[belt]} ring-4 ${BELT_RING_COLORS[belt]} flex items-center justify-center shadow-lg ${
            isLegend ? "legend-glow" : ""
          }`}
        >
          <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none">
            {/* Head */}
            <circle cx="50" cy="28" r="18" fill="rgba(255,255,255,0.9)" />
            {/* Body */}
            <path
              d={
                isLegend
                  ? "M22 70 Q22 50 50 50 Q78 50 78 70 L78 90 L22 90 Z"
                  : outfit === "champion"
                  ? "M25 70 Q25 52 50 52 Q75 52 75 70 L75 90 L25 90 Z"
                  : outfit === "fighter"
                  ? "M28 70 Q28 54 50 54 Q72 54 72 70 L72 90 L28 90 Z"
                  : "M30 72 Q30 55 50 55 Q70 55 70 72 L70 90 L30 90 Z"
              }
              fill="rgba(255,255,255,0.8)"
            />
            {/* Belt stripe */}
            <rect x="32" y="68" width="36" height="6" rx="3" fill={BELT_STRIPE_FILL[belt]} />
            {/* Champion/Legend star */}
            {(outfit === "champion" || outfit === "legend") && (
              <polygon
                points="50,14 52,20 58,20 53,24 55,30 50,26 45,30 47,24 42,20 48,20"
                fill="rgba(251,191,36,0.9)"
              />
            )}
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow border border-gray-100">
          <span className="text-xs font-bold text-gray-700">Lv{level}</span>
        </div>
        {isLegend && (
          <div className="absolute -top-1 -left-1 text-lg animate-bounce">⚡</div>
        )}
      </div>
      <p className="text-lg font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500 capitalize">{OUTFIT_LABEL[outfit]}</p>
    </div>
  );
}
