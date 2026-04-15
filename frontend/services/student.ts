import api from "./api";
import { BeltHistory, CalendarDay, Goal, Payment, StudentAchievements, StudentMe } from "@/types";

export async function getMe(): Promise<StudentMe> {
  const { data } = await api.get<StudentMe>("/api/student/me");
  return data;
}

export async function getAttendance(): Promise<string[]> {
  const { data } = await api.get<string[]>("/api/student/attendance");
  return data;
}

export async function getAttendanceCalendar(
  year: number,
  month: number
): Promise<CalendarDay[]> {
  const { data } = await api.get<CalendarDay[]>(
    "/api/student/attendance/calendar",
    { params: { year, month } }
  );
  return data;
}

export async function getBeltHistory(): Promise<BeltHistory[]> {
  const { data } = await api.get<BeltHistory[]>("/api/student/belt-history");
  return data;
}

export async function getPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/api/student/payments");
  return data;
}

export async function getAchievements(): Promise<StudentAchievements> {
  const { data } = await api.get<StudentAchievements>("/api/student/achievements");
  return data;
}

export async function getGoals(): Promise<Goal[]> {
  const { data } = await api.get<Goal[]>("/api/student/goals");
  return data;
}
