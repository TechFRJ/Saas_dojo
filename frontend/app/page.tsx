"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { role, token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (role === "teacher") {
      router.replace("/dashboard");
    } else if (role === "student") {
      router.replace("/me");
    } else {
      router.replace("/login");
    }
  }, [token, role, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
    </div>
  );
}
