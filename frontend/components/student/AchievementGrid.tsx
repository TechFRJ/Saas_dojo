"use client";

import { useState } from "react";
import { Achievement, AchievementCategory, StudentAchievements } from "@/types";

interface AchievementGridProps {
  data: StudentAchievements;
}

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  presença: "Presença",
  faixa: "Faixas",
  pontos: "Pontos",
  streak: "Streak",
};

const CATEGORIES: AchievementCategory[] = ["presença", "faixa", "pontos", "streak"];

const ICON_MAP: Record<string, string> = {
  trophy: "🏆",
  flame: "🔥",
  fire: "🔥",
  bolt: "⚡",
  crown: "👑",
  star: "⭐",
  medal: "🥇",
  diamond: "💎",
  belt: "🥋",
  dumbbell: "🏋️",
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlocked_at;
  const icon = ICON_MAP[achievement.icon] || "🏆";

  return (
    <div
      className={`relative flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
        isUnlocked
          ? "bg-white border-yellow-200 shadow-sm"
          : "bg-gray-50 border-gray-200 opacity-60"
      }`}
    >
      <div
        className={`text-3xl mb-2 ${isUnlocked ? "" : "grayscale filter"}`}
      >
        {isUnlocked ? icon : "🔒"}
      </div>
      <p className={`text-sm font-semibold ${isUnlocked ? "text-gray-800" : "text-gray-500"}`}>
        {achievement.title}
      </p>
      <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
      {isUnlocked && achievement.unlocked_at && (
        <p className="text-xs text-yellow-600 mt-2 font-medium">
          {new Date(achievement.unlocked_at).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}

export default function AchievementGrid({ data }: AchievementGridProps) {
  const [activeTab, setActiveTab] = useState<AchievementCategory | "all">("all");

  const allAchievements = [...data.unlocked, ...data.locked];
  const filtered =
    activeTab === "all"
      ? allAchievements
      : allAchievements.filter((a) => a.category === activeTab);

  const progress = Math.round((data.total_unlocked / Math.max(data.total, 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">
              {data.total_unlocked} / {data.total} conquistas
            </span>
            <span className="text-sm font-semibold text-yellow-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            activeTab === "all"
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              activeTab === cat
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((ach) => (
          <AchievementCard key={ach.id} achievement={ach} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-6">
          Nenhuma conquista nesta categoria.
        </p>
      )}
    </div>
  );
}
