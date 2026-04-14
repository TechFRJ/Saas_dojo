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
