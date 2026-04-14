"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentProfile } from "@/types";
import { BeltBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { registerAttendance } from "@/services/teacher";

interface StudentCardProps {
  student: StudentProfile;
  onAttendanceRegistered?: (studentId: number) => void;
}

export function StudentCard({ student, onAttendanceRegistered }: StudentCardProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAttendance() {
    setLoading(true);
    setError(null);
    try {
      await registerAttendance(student.id);
      setSuccess(true);
      onAttendanceRegistered?.(student.id);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail ?? "Erro ao registrar presença");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <Link
            href={`/students/${student.id}`}
            className="font-semibold text-gray-900 hover:text-red-600 transition-colors"
          >
            {student.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <BeltBadge belt={student.belt} />
            <span className="text-xs text-gray-500">{student.points} pts</span>
            {student.streak > 0 && (
              <span className="text-xs text-orange-500">
                {student.streak}d
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Button
          onClick={handleAttendance}
          loading={loading}
          variant={success ? "secondary" : "primary"}
          className="text-xs py-1.5"
        >
          {success ? "Registrado!" : "Presença"}
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
