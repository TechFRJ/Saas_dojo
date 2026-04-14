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
  const [calendarData, setCalendarData] = useState<
    { year: number; month: number; days: CalendarDay[] }[]
  >([]);

  useEffect(() => {
    async function load() {
      const today = new Date();
      const results: { year: number; month: number; days: CalendarDay[] }[] = [];

      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        try {
          const days = await getAttendanceCalendar(year, month);
          results.push({ year, month, days });
        } catch {
          results.push({ year, month, days: [] });
        }
      }

      setCalendarData(results);
    }
    load();
  }, [monthsBack]);

  return (
    <div className="space-y-6">
      {calendarData.map(({ year, month, days }) => (
        <MonthGrid key={`${year}-${month}`} year={year} month={month} days={days} />
      ))}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: CalendarDay[];
}) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const presentCount = days.filter((d) => d.present).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          {MONTHS[month - 1]} {year}
        </h3>
        <span className="text-xs text-gray-500">{presentCount} treinos</span>
      </div>
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
        {days.map((day) => (
          <DayCell key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayCell({ day }: { day: CalendarDay }) {
  const date = new Date(day.date + "T00:00:00");
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  return (
    <div
      className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors ${
        day.present
          ? "bg-green-500 text-white"
          : isToday
          ? "bg-gray-200 text-gray-900 font-bold"
          : "bg-gray-50 text-gray-400"
      }`}
      title={day.date}
    >
      {date.getDate()}
    </div>
  );
}
