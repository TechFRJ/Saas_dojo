export type Role = "teacher" | "student";

export type Belt = "white" | "blue" | "purple" | "brown" | "black";
export type Outfit = "default" | "fighter" | "champion" | "legend";
export type PaymentStatus = "pending" | "paid" | "late";

export interface Avatar {
  belt_color: string;
  outfit: Outfit;
  level: number;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  name: string;
  belt: Belt;
  points: number;
  streak: number;
  last_training: string | null;
  created_at: string;
  avatar: Avatar | null;
}

export interface StudentDetail extends StudentProfile {
  belt_history: BeltHistory[];
  attendances: Attendance[];
  payments: Payment[];
  goals?: Goal[];
}

export interface BeltHistory {
  id: number;
  student_id: number;
  belt: string;
  promoted_at: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  date: string;
  created_at: string;
}

export interface Payment {
  id: number;
  student_id: number;
  amount: number;
  status: PaymentStatus;
  due_date: string;
  created_at: string;
}

export interface Dashboard {
  total_students: number;
  students_today: number;
  monthly_revenue: number;
  active_students: number;
}

export interface StudentMe {
  name: string;
  email: string;
  belt: Belt;
  points: number;
  streak: number;
  avatar: Avatar | null;
}

export interface CalendarDay {
  date: string;
  present: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  academy_id: number;
}

// Achievements
export type AchievementCategory = "presença" | "faixa" | "pontos" | "streak";

export interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points_reward: number;
  unlocked_at?: string;
}

export interface StudentAchievements {
  unlocked: Achievement[];
  locked: Achievement[];
  total_unlocked: number;
  total: number;
}

// Goals
export type GoalType = "weekly_trainings" | "monthly_trainings" | "streak_target";

export interface Goal {
  id: number;
  student_id: number;
  type: GoalType;
  target: number;
  current: number;
  period: string;
  completed: boolean;
  created_at: string;
}

// Pagination
export interface PaginatedStudents {
  items: StudentProfile[];
  total: number;
  page: number;
  pages: number;
}

// Attendance with achievements
export interface AttendanceWithAchievements extends Attendance {
  new_achievements: Achievement[];
}

// Reports
export interface AttendanceReportWeekday {
  day: string;
  avg: number;
  total: number;
}

export interface AttendanceReport {
  period_days: number;
  total_trainings: number;
  avg_per_day: number;
  best_day: { date: string; count: number } | null;
  worst_day: { date: string; count: number } | null;
  by_weekday: AttendanceReportWeekday[];
}

export interface ChurnRiskStudent {
  student_id: number;
  name: string;
  days_since_last_training: number;
  streak_lost: boolean;
  risk: "high" | "medium" | "low";
}

export interface RevenueMonth {
  month: string;
  paid: number;
  pending: number;
  late: number;
}

export interface RevenueReport {
  months: RevenueMonth[];
  total_paid: number;
  total_pending: number;
  collection_rate: number;
}
