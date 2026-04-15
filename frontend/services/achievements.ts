import api from "./api";
import { StudentAchievements } from "@/types";

export async function getMyAchievements(): Promise<StudentAchievements> {
  const { data } = await api.get<StudentAchievements>(
    "/api/student/achievements"
  );
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
