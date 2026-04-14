import { Avatar, Belt } from "@/types";

interface AvatarDisplayProps {
  belt: Belt;
  avatar: Avatar | null;
  name: string;
}

const OUTFIT_COLORS: Record<string, string> = {
  default: "from-gray-400 to-gray-600",
  fighter: "from-blue-500 to-blue-700",
  champion: "from-purple-500 to-purple-700",
  legend: "from-yellow-400 to-orange-500",
};

const BELT_RING_COLORS: Record<Belt, string> = {
  white: "ring-gray-300",
  blue: "ring-blue-500",
  purple: "ring-purple-500",
  brown: "ring-amber-700",
  black: "ring-gray-900",
};

export function AvatarDisplay({ belt, avatar, name }: AvatarDisplayProps) {
  const outfit = avatar?.outfit ?? "default";
  const level = avatar?.level ?? 1;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`w-28 h-28 rounded-full bg-gradient-to-br ${OUTFIT_COLORS[outfit]} ring-4 ${BELT_RING_COLORS[belt]} flex items-center justify-center shadow-lg`}
        >
          <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none">
            {/* Head */}
            <circle cx="50" cy="28" r="18" fill="rgba(255,255,255,0.9)" />
            {/* Body */}
            <path
              d="M22 70 Q22 50 50 50 Q78 50 78 70 L78 90 L22 90 Z"
              fill="rgba(255,255,255,0.8)"
            />
            {/* Belt stripe */}
            <rect x="32" y="68" width="36" height="6" rx="3" fill={BELT_STRIPE_FILL[belt]} />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow border border-gray-100">
          <span className="text-xs font-bold text-gray-700">Lv{level}</span>
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500 capitalize">{OUTFIT_LABEL[outfit]}</p>
    </div>
  );
}

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
