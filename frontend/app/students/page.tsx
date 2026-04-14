"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function StudentsPage() {
  const router = useRouter();
  const { role, token } = useAuthStore();

  useEffect(() => {
    if (!token || role !== "teacher") {
      router.replace("/login");
    } else {
      router.replace("/dashboard");
    }
  }, [token, role, router]);

  return null;
}
