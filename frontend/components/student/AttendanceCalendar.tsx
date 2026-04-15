"use client";

import { useEffect, useState } from "react";
import { CalendarDay } from "@/types";
import { getAttendanceCalendar } from "@/services/student";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface AttendanceCalendarProps {
  monthsBack?: number;
}

export function AttendanceCalendar({ monthsBack = 3 }: AttendanceCalendarProps) {
  const today = new Date();
  const [offset, setOffset] = useState(0); // 0 = current month, negative = past
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  const displayDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;

  const minOffset = -(monthsBack - 1);
  const maxOffset = 0;

  useEffect(() => {
    setLoading(true);
    getAttendanceCalendar(year, month)
      .then(setCalendarData)
      .catch(() => setCalendarData([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const presentCount = calendarData.filter((d) => d.present).length;

  return (
    <div className="space-y-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOffset((o) => Math.max(o - 1, minOffset - 2))}
          disabled={offset <= minOffset}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Mês anterior"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            {MONTHS[month - 1]} {year}
          </p>
          {!loading && (
            <p className="text-xs text-gray-500">{presentCount} treinos</p>
          )}
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(o + 1, maxOffset))}
          disabled={offset >= maxOffset}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Próximo mês"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <MonthGrid year={year} month={month} days={calendarData} />
      )}
    </div>
  );
}

function MonthGrid({ year, month, days }: { year: number; month: number; days: CalendarDay[] }) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = new Date();

  // Calculate week intensity: most recent week = darkest green
  const presentDays = days.filter((d) => d.present).map((d) => d.date);
  const lastPresent = presentDays.length > 0 ? presentDays[presentDays.length - 1] : null;

  function getIntensity(dateStr: string): number {
    if (!lastPresent) return 1;
    const last = new Date(lastPresent + "T00:00:00");
    const curr = new Date(dateStr + "T00:00:00");
    const diffWeeks = Math.floor((last.getTime() - curr.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks <= 0) return 3;
    if (diffWeeks <= 1) return 2;
    return 1;
  }

  const intensityClasses: Record<number, string> = {
    1: "bg-green-300 text-green-900",
    2: "bg-green-400 text-white",
    3: "bg-green-600 text-white",
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const date = new Date(day.date + "T00:00:00");
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          const intensity = day.present ? getIntensity(day.date) : 0;
          const colorClass = day.present
            ? intensityClasses[intensity]
            : isToday
            ? "bg-gray-200 text-gray-900 font-bold"
            : "bg-gray-50 text-gray-400";

          return (
            <div
              key={day.date}
              className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors cursor-default group relative ${colorClass}`}
            >
              {date.getDate()}
              {day.present && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  Treinou neste dia
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
