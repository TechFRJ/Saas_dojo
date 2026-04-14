"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getMe, getBeltHistory, getPayments } from "@/services/student";
import { StudentMe, BeltHistory, Payment, Belt } from "@/types";
import { Card } from "@/components/ui/Card";
import { AvatarDisplay } from "@/components/student/AvatarDisplay";
import { BeltBadge } from "@/components/student/BeltBadge";
import { StreakCounter } from "@/components/student/StreakCounter";
import { PointsBar } from "@/components/student/PointsBar";
import { AttendanceCalendar } from "@/components/student/AttendanceCalendar";
import { Badge } from "@/components/ui/Badge";

export default function MePage() {
  const router = useRouter();
  const { role, token, clearAuth } = useAuthStore();
  const [me, setMe] = useState<StudentMe | null>(null);
  const [beltHistory, setBeltHistory] = useState<BeltHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
        const [meData, histData, payData] = await Promise.all([
          getMe(),
          getBeltHistory(),
          getPayments(),
        ]);
        setMe(meData);
        setBeltHistory(histData);
        setPayments(payData);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const level = me.avatar?.level ?? 1;
  const pendingPayments = payments.filter((p) => p.status !== "paid");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar + Identity */}
        <Card className="text-center">
          <AvatarDisplay belt={me.belt} avatar={me.avatar} name={me.name} />
          <div className="mt-4">
            <BeltBadge belt={me.belt as Belt} large />
          </div>
        </Card>

        {/* Points + Streak */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <PointsBar points={me.points} level={level} />
          </Card>
          <StreakCounter streak={me.streak} />
        </div>

        {/* Attendance Calendar */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Histórico de Presença
          </h2>
          <AttendanceCalendar monthsBack={3} />
        </Card>

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
                <Badge variant="warning" className="ml-2">
                  {pendingPayments.length} pendente{pendingPayments.length > 1 ? "s" : ""}
                </Badge>
              )}
            </h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
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
                    {p.status === "paid" ? "Pago" : p.status === "late" ? "Atrasado" : "Pendente"}
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
