"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getDashboard, listStudents, createStudent } from "@/services/teacher";
import { Dashboard, StudentProfile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StudentCard } from "@/components/teacher/StudentCard";

export default function DashboardPage() {
  const router = useRouter();
  const { role, token } = useAuthStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!token || role !== "teacher") {
      router.replace("/login");
    }
  }, [token, role, router]);

  const loadData = useCallback(async () => {
    try {
      const [dash, studs] = await Promise.all([
        getDashboard(),
        listStudents({ search: search || undefined }),
      ]);
      setDashboard(dash);
      setStudents(studs);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [search, router]);

  useEffect(() => {
    if (token && role === "teacher") {
      loadData();
    }
  }, [token, role, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.236L19 8v8l-7 3.882L5 16V8l7-3.764z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">FightClub</h1>
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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total de Alunos" value={dashboard?.total_students ?? 0} icon="👥" />
          <MetricCard label="Presentes Hoje" value={dashboard?.students_today ?? 0} icon="✅" />
          <MetricCard
            label="Receita Mensal"
            value={`R$ ${(dashboard?.monthly_revenue ?? 0).toFixed(2)}`}
            icon="💰"
          />
          <MetricCard label="Alunos Ativos" value={dashboard?.active_students ?? 0} icon="🥋" />
        </div>

        {/* Students section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Alunos</h2>
            <Button onClick={() => setShowModal(true)}>Novo Aluno</Button>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum aluno encontrado.
              </p>
            ) : (
              students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onAttendanceRegistered={loadData}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <NewStudentModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function NewStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createStudent({ name, email, password });
      onCreated();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail ?? "Erro ao criar aluno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Novo Aluno</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="João Silva"
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@email.com"
            required
          />
          <Input
            label="Senha inicial"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Criar Aluno
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
