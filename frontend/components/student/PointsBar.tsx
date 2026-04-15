"use client";

import { useEffect, useState } from "react";

interface PointsBarProps {
  points: number;
  level: number;
}

function getLevelColor(level: number): string {
  if (level >= 10) return "from-yellow-400 to-amber-500";
  if (level >= 7) return "from-orange-400 to-orange-600";
  if (level >= 4) return "from-green-400 to-emerald-600";
  return "from-blue-400 to-blue-600";
}

export function PointsBar({ points, level }: PointsBarProps) {
  const pointsInLevel = points % 100;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pointsInLevel), 100);
    return () => clearTimeout(timer);
  }, [pointsInLevel]);

  const colorClass = getLevelColor(level);
  const remaining = 100 - pointsInLevel;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">
          {points} <span className="text-gray-400 font-normal">pontos totais</span>
        </span>
        <span className="font-semibold text-gray-700">Nível {level}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
          style={{
            width: `${animated}%`,
            transition: "width 1s ease",
          }}
        />
      </div>
      <p className="text-xs text-gray-500 text-right">
        {remaining} pts para o próximo nível
      </p>
    </div>
  );
}
