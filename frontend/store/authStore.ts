"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser, Role } from "@/types";

interface AuthState {
  token: string | null;
  role: Role | null;
  user: AuthUser | null;
  setAuth: (token: string, role: Role, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      setAuth: (token, role, user) => set({ token, role, user }),
      clearAuth: () => set({ token: null, role: null, user: null }),
    }),
    {
      name: "fightclub-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
