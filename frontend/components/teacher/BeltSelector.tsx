"use client";

import { useState } from "react";
import { Belt } from "@/types";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { promoteBelt } from "@/services/teacher";
import { useToast } from "@/components/ui/Toast";

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

interface BeltSelectorProps {
  studentId: number;
  currentBelt: Belt;
  studentName?: string;
  onPromoted?: () => void;
}

export function BeltSelector({ studentId, currentBelt, studentName, onPromoted }: BeltSelectorProps) {
  const [selected, setSelected] = useState<Belt>(currentBelt);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();

  async function handlePromote() {
    setLoading(true);
    setShowConfirm(false);
    try {
      await promoteBelt(studentId, selected);
      showToast(
        `${studentName ?? "Aluno"} graduado para Faixa ${BELT_LABELS[selected]}! 🥋`,
        "achievement"
      );
      onPromoted?.();
    } catch {
      showToast("Erro ao atualizar faixa", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
          <Button
            onClick={() => setShowConfirm(true)}
            loading={loading}
            variant="primary"
          >
            Promover para {BELT_LABELS[selected]}
          </Button>
        )}
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirmar Graduação"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" loading={loading} onClick={handlePromote}>
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Tem certeza que deseja graduar{" "}
          <strong>{studentName ?? "este aluno"}</strong> para{" "}
          <strong>Faixa {BELT_LABELS[selected]}</strong>?
        </p>
      </Modal>
    </>
  );
}
