"use client";

import { useState } from "react";
import { Belt } from "@/types";
import { Button } from "@/components/ui/Button";
import { promoteBelt } from "@/services/teacher";

const BELTS: Belt[] = ["white", "blue", "purple", "brown", "black"];
const BELT_LABELS: Record<Belt, string> = {
  white: "Branca",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
};
const BELT_COLORS: Record<Belt, string> = {
  white: "bg-gray-100 border-gray-300 text-gray-800",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-600 text-white",
  brown: "bg-amber-700 text-white",
  black: "bg-gray-900 text-white",
};

interface BeltSelectorProps {
  studentId: number;
  currentBelt: Belt;
  onPromoted?: () => void;
}

export function BeltSelector({ studentId, currentBelt, onPromoted }: BeltSelectorProps) {
  const [selected, setSelected] = useState<Belt>(currentBelt);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePromote() {
    if (selected === currentBelt) return;
    setLoading(true);
    setMessage(null);
    try {
      await promoteBelt(studentId, selected);
      setMessage("Faixa atualizada com sucesso!");
      onPromoted?.();
    } catch {
      setMessage("Erro ao atualizar faixa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {BELTS.map((belt) => (
          <button
            key={belt}
            onClick={() => setSelected(belt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${BELT_COLORS[belt]} ${
              selected === belt ? "ring-2 ring-offset-2 ring-red-500 scale-105" : "opacity-70 hover:opacity-100"
            }`}
          >
            {BELT_LABELS[belt]}
          </button>
        ))}
      </div>
      {selected !== currentBelt && (
        <div className="flex items-center gap-2">
          <Button onClick={handlePromote} loading={loading} variant="primary">
            Promover para {BELT_LABELS[selected]}
          </Button>
          {message && (
            <span className="text-sm text-green-600">{message}</span>
          )}
        </div>
      )}
    </div>
  );
}
