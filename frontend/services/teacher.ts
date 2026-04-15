import api from "./api";
import {
  AttendanceWithAchievements,
  Belt,
  Dashboard,
  Goal,
  Payment,
  PaginatedStudents,
  StudentAchievements,
  StudentDetail,
  StudentProfile,
} from "@/types";

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/api/teacher/dashboard");
  return data;
}

export async function listStudents(params?: {
  belt?: Belt;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedStudents> {
  const { data } = await api.get<PaginatedStudents>("/api/teacher/students", {
    params,
  });
  return data;
}

export async function getStudent(id: number): Promise<StudentDetail> {
  const { data } = await api.get<StudentDetail>(`/api/teacher/students/${id}`);
  return data;
}

export async function createStudent(payload: {
  email: string;
  password: string;
  name: string;
}): Promise<StudentProfile> {
  const { data } = await api.post<StudentProfile>(
    "/api/teacher/students",
    payload
  );
  return data;
}

export async function updateStudent(
  id: number,
  payload: { name?: string; belt?: Belt }
): Promise<StudentProfile> {
  const { data } = await api.put<StudentProfile>(
    `/api/teacher/students/${id}`,
    payload
  );
  return data;
}

export async function registerAttendance(
  studentId: number
): Promise<AttendanceWithAchievements> {
  const { data } = await api.post<AttendanceWithAchievements>(
    "/api/teacher/attendance",
    { student_id: studentId }
  );
  return data;
}

export async function listPayments(params?: {
  status?: string;
  student_id?: number;
}): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/api/teacher/payments", {
    params,
  });
  return data;
}

export async function createPayment(payload: {
  student_id: number;
  amount: number;
  due_date: string;
}): Promise<Payment> {
  const { data } = await api.post<Payment>("/api/teacher/payments", payload);
  return data;
}

export async function updatePayment(
  id: number,
  status: string
): Promise<Payment> {
  const { data } = await api.put<Payment>(`/api/teacher/payments/${id}`, {
    status,
  });
  return data;
}

export async function promoteBelt(
  studentId: number,
  belt: Belt
): Promise<StudentProfile> {
  const { data } = await api.post<StudentProfile>("/api/teacher/belt", {
    student_id: studentId,
    belt,
  });
  return data;
}

export async function getStudentAchievements(
  studentId: number
): Promise<StudentAchievements> {
  const { data } = await api.get<StudentAchievements>(
    `/api/teacher/students/${studentId}/achievements`
  );
  return data;
}

export async function createGoal(payload: {
  student_id: number;
  type: string;
  target: number;
  period: string;
}): Promise<Goal> {
  const { data } = await api.post<Goal>("/api/teacher/goals", payload);
  return data;
}
