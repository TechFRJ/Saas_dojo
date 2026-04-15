"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getMe, getBeltHistory, getPayments, getAttendance, getAchievements, getGoals } from "@/services/student";
import { StudentMe, BeltHistory, Payment, Belt, StudentAchievements, Goal } from "@/types";
import { Card } from "@/components/ui/Card";
import { AvatarDisplay } from "@/components/student/AvatarDisplay";
import { BeltBadge } from "@/components/student/BeltBadge";
import { PointsBar } from "@/components/student/PointsBar";
import { AttendanceCalendar } from "@/components/student/AttendanceCalendar";
import StreakDots from "@/components/student/StreakDots";
import AchievementGrid from "@/components/student/AchievementGrid";
import GoalCard from "@/components/student/GoalCard";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function MePage() {
  const router = useRouter();
  const { role, token, clearAuth } = useAuthStore();
  const [me, setMe] = useState<StudentMe | null>(null);
  const [beltHistory, setBeltHistory] = useState<BeltHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<StudentAchievements | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== "student") {
      router.replace("/login");
    }
  }, [token, role, router]);

  useEffect(() => {
    if (!token || role !== "student") return;

    async function load() {
      try {
        const [meData, histData, payData, datesData, achData, goalsData] =
          await Promise.all([
            getMe(),
            getBeltHistory(),
            getPayments(),
            getAttendance(),
            getAchievements(),
            getGoals(),
          ]);
        setMe(meData);
        setBeltHistory(histData);
        setPayments(payData);
        setAttendanceDates(datesData);
        setAchievements(achData);
        setGoals(goalsData);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, role, router]);

  function handleLogout() {
    clearAuth();
    sessionStorage.removeItem("fightclub-auth");
    fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
  }

  if (loading || !me) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200" />
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </main>
      </div>
    );
  }

  const level = me.avatar?.level ?? 1;
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const streak = me.streak;
  const streakBonusSoon = streak > 0 && streak % 5 === 4;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.236L19 8v8l-7 3.882L5 16V8l7-3.764z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">FightClub</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* In-app notifications */}
        {pendingPayments.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <span className="text-lg">⚠️</span>
            <span>
              Você tem {pendingPayments.length} mensalidade{pendingPayments.length > 1 ? "s" : ""} pendente
              {pendingPayments.length > 1 ? "s" : ""} — Venc.{" "}
              {new Date(pendingPayments[0].due_date + "T00:00:00").toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
        {streakBonusSoon && (
          <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
            <span className="text-lg">🔥</span>
            <span>Falta 1 dia para seu bônus de streak! Continue assim!</span>
          </div>
        )}

        {/* Avatar + Identity */}
        <Card className="text-center">
          <div className="flex flex-col items-center">
            <AvatarDisplay belt={me.belt} avatar={me.avatar} name={me.name} />
            <h2 className="text-lg font-bold text-gray-900 mt-3">{me.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{me.email}</p>
            <BeltBadge belt={me.belt as Belt} large />
          </div>
        </Card>

        {/* Points Bar */}
        <Card>
          <PointsBar points={me.points} level={level} />
        </Card>

        {/* Streak Dots */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Streak</h2>
          <StreakDots attendanceDates={attendanceDates} streak={streak} />
        </Card>

        {/* Attendance Calendar */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Histórico de Presença
          </h2>
          <AttendanceCalendar monthsBack={3} />
        </Card>

        {/* Goals */}
        {goals.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Metas</h2>
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Conquistas</h2>
            <AchievementGrid data={achievements} />
          </Card>
        )}

        {/* Belt History */}
        {beltHistory.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Histórico de Faixas
            </h2>
            <div className="space-y-2">
              {beltHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <BeltBadge belt={h.belt as Belt} />
                  <span className="text-sm text-gray-500">
                    {new Date(h.promoted_at + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Mensalidades
              {pendingPayments.length > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  {pendingPayments.length} pendente{pendingPayments.length > 1 ? "s" : ""}
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      R$ {p.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Venc: {new Date(p.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      p.status === "paid"
                        ? "success"
                        : p.status === "late"
                        ? "error"
                        : "warning"
                    }
                  >
                    {p.status === "paid"
                      ? "Pago"
                      : p.status === "late"
                      ? "Atrasado"
                      : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
