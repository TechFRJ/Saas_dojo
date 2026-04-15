import api from "./api";
import { AttendanceReport, ChurnRiskStudent, RevenueReport } from "@/types";

export async function getAttendanceReport(
  period = 30
): Promise<AttendanceReport> {
  const { data } = await api.get<AttendanceReport>(
    "/api/teacher/reports/attendance",
    { params: { period } }
  );
  return data;
}

export async function getChurnRisk(): Promise<ChurnRiskStudent[]> {
  const { data } = await api.get<ChurnRiskStudent[]>(
    "/api/teacher/reports/churn-risk"
  );
  return data;
}

export async function getRevenueReport(months = 3): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>(
    "/api/teacher/reports/revenue",
    { params: { months } }
  );
  return data;
}
