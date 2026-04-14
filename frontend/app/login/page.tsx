"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";
import { getMe } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { access_token, role } = await login({ email, password });

      // Store token in Zustand (persists to sessionStorage) FIRST
      // so the axios interceptor can read it for the getMe() call below
      const tempUser = { id: 0, email, role, academy_id: 0 };
      setAuth(access_token, role, tempUser);

      // Fetch full user details — interceptor now finds the token in sessionStorage
      const user = await getMe();
      setAuth(access_token, role, user);

      // Store role in readable cookie for Next.js middleware
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: access_token, role }),
      });

      if (role === "teacher") {
        router.push("/dashboard");
      } else {
        router.push("/me");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(
        apiError.response?.data?.detail ?? "Erro ao fazer login. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4 shadow-lg">
            <svg
              viewBox="0 0 24 24"
              className="w-9 h-9 text-white"
              fill="currentColor"
            >
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.236L19 8v8l-7 3.882L5 16V8l7-3.764z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">FightClub SaaS</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema para academias de luta</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              variant="primary"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              FightClub SaaS &mdash; Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
