"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getStudent } from "@/services/teacher";
import { StudentDetail, Belt } from "@/types";
import { Card } from "@/components/ui/Card";
import { BeltBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AttendanceButton } from "@/components/teacher/AttendanceButton";
import { BeltSelector } from "@/components/teacher/BeltSelector";
import { PaymentRow } from "@/components/teacher/PaymentRow";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { role, token } = useAuthStore();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = Number(params.id);

  useEffect(() => {
    if (!token || role !== "teacher") {
      router.replace("/login");
    }
  }, [token, role, router]);

  const loadStudent = useCallback(async () => {
    try {
      const data = await getStudent(studentId);
      setStudent(data);
    } catch {
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [studentId, router]);

  useEffect(() => {
    if (token && role === "teacher") {
      loadStudent();
    }
  }, [token, role, loadStudent]);

  if (loading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const attendanceThisMonth = student.attendances.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Voltar
          </Button>
          <h1 className="text-lg font-bold text-gray-900">{student.name}</h1>
          <BeltBadge belt={student.belt} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Profile + Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-gray-500 mb-4">Perfil</h2>
            <div className="space-y-3">
              <StatRow label="Pontos" value={student.points} />
              <StatRow label="Sequência" value={`${student.streak} dias`} />
              <StatRow label="Nível" value={`${student.avatar?.level ?? 1}`} />
              <StatRow label="Outfit" value={student.avatar?.outfit ?? "default"} />
            </div>
            <div className="mt-4">
              <AttendanceButton studentId={student.id} onSuccess={loadStudent} />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-gray-500 mb-4">Graduação</h2>
            <BeltSelector
              studentId={student.id}
              currentBelt={student.belt as Belt}
              onPromoted={loadStudent}
            />
          </Card>
        </div>

        {/* Attendance this month */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-4">
            Presenças este mês ({attendanceThisMonth.length})
          </h2>
          {attendanceThisMonth.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma presença registrada este mês.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attendanceThisMonth.map((a) => (
                <span
                  key={a.id}
                  className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium"
                >
                  {new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Belt history */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-4">Histórico de Faixas</h2>
          {student.belt_history.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma graduação registrada.</p>
          ) : (
            <div className="space-y-2">
              {student.belt_history.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <BeltBadge belt={h.belt as Belt} />
                  <span className="text-sm text-gray-500">
                    {new Date(h.promoted_at + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Payments */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Pagamentos</h2>
          {student.payments.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum pagamento registrado.</p>
          ) : (
            student.payments.map((p) => (
              <PaymentRow key={p.id} payment={p} onUpdated={loadStudent} />
            ))
          )}
        </Card>
      </main>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
