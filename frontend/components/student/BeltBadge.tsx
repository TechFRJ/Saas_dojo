import { Belt } from "@/types";

const BELT_STYLES: Record<Belt, string> = {
  white: "bg-gray-100 text-gray-800 border border-gray-400",
  blue: "bg-blue-600 text-white",
  purple: "bg-purple-600 text-white",
  brown: "bg-amber-800 text-white",
  black: "bg-gray-950 text-white",
};

const BELT_LABELS: Record<Belt, string> = {
  white: "Faixa Branca",
  blue: "Faixa Azul",
  purple: "Faixa Roxa",
  brown: "Faixa Marrom",
  black: "Faixa Preta",
};

interface BeltBadgeProps {
  belt: Belt;
  large?: boolean;
}

export function BeltBadge({ belt, large = false }: BeltBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
        large ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs"
      } ${BELT_STYLES[belt]}`}
    >
      <span className={`rounded-full ${large ? "w-3 h-3" : "w-2 h-2"} bg-current opacity-60`} />
      {BELT_LABELS[belt]}
    </span>
  );
}
