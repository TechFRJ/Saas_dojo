"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentProfile } from "@/types";
import { BeltBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { registerAttendance } from "@/services/teacher";
import { useToast } from "@/components/ui/Toast";

interface StudentCardProps {
  student: StudentProfile;
  onAttendanceRegistered?: (studentId: number) => void;
}

function getLastTrainingBadge(lastTraining: string | null): {
  label: string;
  className: string;
} {
  if (!lastTraining) {
    return { label: "Nunca treinou", className: "bg-gray-100 text-gray-500" };
  }
  const last = new Date(lastTraining);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Treinou hoje", className: "bg-green-100 text-green-700" };
  if (diffDays === 1) return { label: "Treinou ontem", className: "bg-yellow-100 text-yellow-700" };
  if (diffDays <= 3) return { label: `${diffDays} dias`, className: "bg-orange-100 text-orange-700" };
  return { label: `${diffDays} dias sem treinar`, className: "bg-red-100 text-red-700" };
}

export function StudentCard({ student, onAttendanceRegistered }: StudentCardProps) {
  const [loading, setLoading] = useState(false);
  const [trainedToday, setTrainedToday] = useState(() => {
    if (!student.last_training) return false;
    const last = new Date(student.last_training);
    const today = new Date();
    return (
      last.getFullYear() === today.getFullYear() &&
      last.getMonth() === today.getMonth() &&
      last.getDate() === today.getDate()
    );
  });
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleAttendance() {
    setLoading(true);
    setError(null);
    try {
      const result = await registerAttendance(student.id);
      setTrainedToday(true);
      showToast(`Presença registrada! +10 pts`, "success");
      if (result.new_achievements?.length > 0) {
        result.new_achievements.forEach((ach) => {
          setTimeout(() => {
            showToast(`Nova conquista desbloqueada: "${ach.title}"!`, "achievement");
          }, 800);
        });
      }
      onAttendanceRegistered?.(student.id);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      const msg = apiError.response?.data?.detail ?? "Erro ao registrar presença";
      setError(msg);
      if (msg.includes("já registrada")) setTrainedToday(true);
    } finally {
      setLoading(false);
    }
  }

  const badge = getLastTrainingBadge(student.last_training);

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <Link
            href={`/students/${student.id}`}
            className="font-semibold text-gray-900 hover:text-red-600 transition-colors"
          >
            {student.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <BeltBadge belt={student.belt} />
            <span className="text-xs text-gray-500 hidden md:inline">{student.points} pts</span>
            {student.streak > 0 && (
              <span className="text-xs text-orange-500">{student.streak}d 🔥</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
        {trainedToday ? (
          <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium">
            ✓ Registrado
          </span>
        ) : (
          <Button
            onClick={handleAttendance}
            loading={loading}
            variant="primary"
            className="text-xs py-1.5"
          >
            Presença
          </Button>
        )}
        {error && !trainedToday && (
          <span className="text-xs text-red-500 max-w-[120px] text-right">{error}</span>
        )}
      </div>
    </div>
  );
}
