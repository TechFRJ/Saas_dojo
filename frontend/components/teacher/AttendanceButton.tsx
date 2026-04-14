"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { registerAttendance } from "@/services/teacher";

interface AttendanceButtonProps {
  studentId: number;
  onSuccess?: () => void;
}

export function AttendanceButton({ studentId, onSuccess }: AttendanceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      await registerAttendance(studentId);
      setMessage("Presença registrada!");
      setIsError(false);
      onSuccess?.();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setMessage(apiError.response?.data?.detail ?? "Erro ao registrar");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleClick} loading={loading} variant="primary">
        Registrar Presença
      </Button>
      {message && (
        <p className={`text-xs ${isError ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
