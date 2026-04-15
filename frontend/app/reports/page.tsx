"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getAttendanceReport, getChurnRisk, getRevenueReport } from "@/services/reports";
import { AttendanceReport, ChurnRiskStudent, RevenueReport } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const RISK_STYLES: Record<string, { label: string; className: string }> = {
  high: { label: "Alto", className: "bg-red-100 text-red-700" },
  medium: { label: "Médio", className: "bg-yellow-100 text-yellow-700" },
  low: { label: "Baixo", className: "bg-green-100 text-green-700" },
};

export default function ReportsPage() {
  const router = useRouter();
  const { role, token } = useAuthStore();
  const [attendance, setAttendance] = useState<AttendanceReport | null>(null);
  const [churn, setChurn] = useState<ChurnRiskStudent[]>([]);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== "teacher") {
      router.replace("/login");
    }
  }, [token, role, router]);

  useEffect(() => {
    if (!token || role !== "teacher") return;
    Promise.all([getAttendanceReport(30), getChurnRisk(), getRevenueReport(3)])
      .then(([att, ch, rev]) => {
        setAttendance(att);
        setChurn(ch);
        setRevenue(rev);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [token, role, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200" />
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Relatórios</h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              useAuthStore.getState().clearAuth();
              sessionStorage.removeItem("fightclub-auth");
              fetch("/api/auth", { method: "DELETE" });
              router.push("/login");
            }}
          >
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Section: Frequência */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Frequência por Dia da Semana</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <p className="text-xs text-gray-500">Total (30 dias)</p>
              <p className="text-2xl font-bold text-gray-900">{attendance?.total_trainings ?? 0}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Média por dia</p>
              <p className="text-2xl font-bold text-gray-900">{attendance?.avg_per_day ?? 0}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Melhor dia</p>
              <p className="text-2xl font-bold text-gray-900">{attendance?.best_day?.count ?? 0}</p>
              <p className="text-xs text-gray-400">
                {attendance?.best_day
                  ? new Date(attendance.best_day.date + "T00:00:00").toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </Card>
          </div>
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendance?.by_weekday ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [value, "Treinos"]}
                  contentStyle={{ borderRadius: "8px", fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} name="Treinos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Section: Risco de Churn */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Risco de Churn</h2>
          {churn.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-4 text-sm">
                Todos os alunos estão em dia! 🎉
              </p>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-gray-100">
                {churn.map((student) => {
                  const riskStyle = RISK_STYLES[student.risk];
                  return (
                    <div key={student.student_id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          {student.days_since_last_training} dias sem treinar
                          {student.streak_lost && " · streak perdido"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${riskStyle.className}`}
                        >
                          {riskStyle.label}
                        </span>
                        <Button
                          variant="ghost"
                          className="text-xs py-1 px-2 text-blue-600 hover:text-blue-800"
                          onClick={() => alert("Em breve: envio de lembrete!")}
                        >
                          Lembrete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>

        {/* Section: Receita */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Receita</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <p className="text-xs text-gray-500">Total Recebido</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {(revenue?.total_paid ?? 0).toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Total Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">
                R$ {(revenue?.total_pending ?? 0).toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Taxa de Recebimento</p>
              <p className="text-2xl font-bold text-gray-900">{revenue?.collection_rate ?? 0}%</p>
            </Card>
          </div>
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={revenue?.months ?? []}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value, name) => [
                    `R$ ${Number(value).toFixed(2)}`,
                    name === "paid" ? "Pago" : name === "pending" ? "Pendente" : "Atrasado",
                  ]}
                  contentStyle={{ borderRadius: "8px", fontSize: 12 }}
                />
                <Legend
                  formatter={(value) =>
                    value === "paid" ? "Pago" : value === "pending" ? "Pendente" : "Atrasado"
                  }
                />
                <Line type="monotone" dataKey="paid" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="late" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </section>
      </main>
    </div>
  );
}
