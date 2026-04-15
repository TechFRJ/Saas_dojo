"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getStudent, getStudentAchievements, createGoal } from "@/services/teacher";
import { StudentDetail, Belt, StudentAchievements, Goal } from "@/types";
import { Card } from "@/components/ui/Card";
import { BeltBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { AttendanceButton } from "@/components/teacher/AttendanceButton";
import { BeltSelector } from "@/components/teacher/BeltSelector";
import { PaymentRow } from "@/components/teacher/PaymentRow";
import AchievementGrid from "@/components/student/AchievementGrid";
import GoalCard from "@/components/student/GoalCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Tab = "overview" | "achievements" | "goals";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { role, token } = useAuthStore();
  const { showToast } = useToast();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [achievements, setAchievements] = useState<StudentAchievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showGoalModal, setShowGoalModal] = useState(false);

  const studentId = Number(params.id);

  useEffect(() => {
    if (!token || role !== "teacher") {
      router.replace("/login");
    }
  }, [token, role, router]);

  const loadStudent = useCallback(async () => {
    try {
      const [data, ach] = await Promise.all([
        getStudent(studentId),
        getStudentAchievements(studentId),
      ]);
      setStudent(data);
      setAchievements(ach);
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
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200" />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </main>
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Visão Geral" },
    { id: "achievements", label: `Conquistas${achievements ? ` (${achievements.total_unlocked})` : ""}` },
    { id: "goals", label: "Metas" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <Button variant="ghost" onClick={() => router.back()} className="shrink-0">
            ← Voltar
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {student.name.charAt(0)}
            </div>
            <h1 className="text-base font-bold text-gray-900 truncate">{student.name}</h1>
            <BeltBadge belt={student.belt} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Quick summary */}
        <Card>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{student.points}</p>
              <p className="text-xs text-gray-500">Pontos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{student.streak}</p>
              <p className="text-xs text-gray-500">Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{student.avatar?.level ?? 1}</p>
              <p className="text-xs text-gray-500">Nível</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{student.attendances.length}</p>
              <p className="text-xs text-gray-500">Treinos Totais</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-xs md:text-sm py-2 px-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Visão Geral */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <Card>
                <h2 className="text-sm font-semibold text-gray-500 mb-4">Ações</h2>
                <AttendanceButton studentId={student.id} onSuccess={loadStudent} />
              </Card>

              <Card>
                <h2 className="text-sm font-semibold text-gray-500 mb-4">Graduação</h2>
                <BeltSelector
                  studentId={student.id}
                  currentBelt={student.belt as Belt}
                  studentName={student.name}
                  onPromoted={loadStudent}
                />
              </Card>
            </div>

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
          </div>
        )}

        {/* Tab: Conquistas */}
        {activeTab === "achievements" && (
          <Card>
            {achievements ? (
              <AchievementGrid data={achievements} />
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">Carregando conquistas...</p>
            )}
          </Card>
        )}

        {/* Tab: Metas */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowGoalModal(true)} variant="primary">
                Nova Meta
              </Button>
            </div>
            {student.goals && student.goals.length > 0 ? (
              (student.goals as Goal[]).map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))
            ) : (
              <Card>
                <p className="text-gray-400 text-sm text-center py-4">
                  Nenhuma meta definida para este aluno.
                </p>
              </Card>
            )}
          </div>
        )}
      </main>

      {showGoalModal && (
        <NewGoalModal
          studentId={studentId}
          onClose={() => setShowGoalModal(false)}
          onCreated={() => { setShowGoalModal(false); loadStudent(); showToast("Meta criada com sucesso!", "success"); }}
        />
      )}
    </div>
  );
}

function NewGoalModal({
  studentId,
  onClose,
  onCreated,
}: {
  studentId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState("weekly_trainings");
  const [target, setTarget] = useState("4");
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const isoYear = today.getFullYear();
  const isoWeek = getISOWeek(today);
  const defaultPeriods: Record<string, string> = {
    weekly_trainings: `${isoYear}-W${String(isoWeek).padStart(2, "0")}`,
    monthly_trainings: today.toISOString().slice(0, 7),
    streak_target: today.toISOString().slice(0, 7),
  };

  async function handleCreate() {
    setLoading(true);
    try {
      await createGoal({
        student_id: studentId,
        type,
        target: parseInt(target),
        period: defaultPeriods[type],
      });
      onCreated();
    } catch {
      // silently fail, parent handles
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Nova Meta"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={loading} onClick={handleCreate}>Criar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de Meta</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="weekly_trainings">Treinos na semana</option>
            <option value="monthly_trainings">Treinos no mês</option>
            <option value="streak_target">Meta de streak</option>
          </select>
        </div>
        <Input
          label="Meta (número)"
          type="number"
          min="1"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Período: <strong>{defaultPeriods[type]}</strong>
        </p>
      </div>
    </Modal>
  );
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}
