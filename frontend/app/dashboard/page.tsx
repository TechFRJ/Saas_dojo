"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getDashboard, listStudents, createStudent, listPayments } from "@/services/teacher";
import { Belt, Dashboard, StudentProfile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StudentCard } from "@/components/teacher/StudentCard";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import Link from "next/link";

const BELT_FILTERS: { value: Belt | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "white", label: "Branca" },
  { value: "blue", label: "Azul" },
  { value: "purple", label: "Roxa" },
  { value: "brown", label: "Marrom" },
  { value: "black", label: "Preta" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { role, token } = useAuthStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState<Belt | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || role !== "teacher") {
      router.replace("/login");
    }
  }, [token, role, router]);

  const loadData = useCallback(
    async (searchQuery = search, belt = beltFilter) => {
      try {
        const [dash, studsResult, payments] = await Promise.all([
          getDashboard(),
          listStudents({
            search: searchQuery || undefined,
            belt: belt !== "all" ? belt : undefined,
            limit: 50,
          }),
          listPayments({ status: "pending" }),
        ]);
        setDashboard(dash);

        // Sort: most at-risk (oldest last_training) first
        const sorted = [...studsResult.items].sort((a, b) => {
          if (!a.last_training && !b.last_training) return 0;
          if (!a.last_training) return -1;
          if (!b.last_training) return 1;
          return new Date(a.last_training).getTime() - new Date(b.last_training).getTime();
        });
        setStudents(sorted);

        const pending = payments.reduce((sum, p) => sum + p.amount, 0);
        setPendingRevenue(pending);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    },
    [search, beltFilter, router]
  );

  // Initial load
  useEffect(() => {
    if (token && role === "teacher") {
      loadData();
    }
  }, [token, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadData(value, beltFilter);
    }, 300);
  };

  const handleBeltFilter = (belt: Belt | "all") => {
    setBeltFilter(belt);
    loadData(search, belt);
  };

  const presenceRate =
    dashboard && dashboard.active_students > 0
      ? Math.round((dashboard.students_today / dashboard.active_students) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200" />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonTable rows={5} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.236L19 8v8l-7 3.882L5 16V8l7-3.764z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">FightClub</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/reports">
              <Button variant="ghost" className="text-sm">Relatórios</Button>
            </Link>
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total de Alunos"
            value={dashboard?.total_students ?? 0}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            color="blue"
          />
          <MetricCard
            label="Presentes Hoje"
            value={dashboard?.students_today ?? 0}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <MetricCard
            label="Receita Mensal"
            value={`R$ ${(dashboard?.monthly_revenue ?? 0).toFixed(2)}`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="emerald"
            sub={
              pendingRevenue > 0 ? (
                <span className="text-xs text-red-500 font-medium">
                  R$ {pendingRevenue.toFixed(2)} pendente
                </span>
              ) : null
            }
          />
          <MetricCard
            label="Alunos Ativos"
            value={dashboard?.active_students ?? 0}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-purple-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Academy Health Indicator */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">Saúde da Academia</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {dashboard?.students_today ?? 0} de {dashboard?.active_students ?? 0} alunos ativos treinaram hoje
              </p>
            </div>
            <span
              className={`text-lg font-bold ${
                presenceRate >= 70
                  ? "text-green-600"
                  : presenceRate >= 40
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {presenceRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                presenceRate >= 70
                  ? "bg-green-500"
                  : presenceRate >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${presenceRate}%` }}
            />
          </div>
        </Card>

        {/* Students section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Alunos</h2>
            <Button onClick={() => setShowModal(true)}>Novo Aluno</Button>
          </div>

          <div className="mb-3">
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Belt filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            {BELT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleBeltFilter(f.value)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  beltFilter === f.value
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
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
                  onAttendanceRegistered={() => loadData(search, beltFilter)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <NewStudentModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadData(search, beltFilter); }}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: React.ReactNode;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    emerald: "bg-emerald-50",
    purple: "bg-purple-50",
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgMap[color] || "bg-gray-50"}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
          {sub}
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
