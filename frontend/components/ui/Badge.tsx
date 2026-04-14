import React from "react";
import { Belt } from "@/types";

const BELT_STYLES: Record<Belt, string> = {
  white: "bg-gray-100 text-gray-800 border border-gray-300",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  brown: "bg-amber-100 text-amber-800",
  black: "bg-gray-900 text-white",
};

const BELT_LABELS: Record<Belt, string> = {
  white: "Branca",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
};

interface BeltBadgeProps {
  belt: Belt;
}

export function BeltBadge({ belt }: BeltBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BELT_STYLES[belt]}`}
    >
      {BELT_LABELS[belt]}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "default";
}

const VARIANT_STYLES = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  default: "bg-gray-100 text-gray-800",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
