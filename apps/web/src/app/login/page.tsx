"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHero } from "@/features/auth/AuthHero";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { RouteLoading } from "@/features/navigation/RouteLoading";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { getMe, refreshSession, type AuthResponse } from "@/lib/api";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthSession,
} from "@/lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (!token && !refreshToken) {
      setIsCheckingSession(false);
      return;
    }

    async function checkSession() {
      try {
        if (token) {
          await getMe(token);
        } else if (refreshToken) {
          const refreshedSession = await refreshSession(refreshToken);
          storeAuthSession(refreshedSession);
        }

        router.replace("/dashboard");
      } catch {
        clearAuthSession();
        setIsCheckingSession(false);
      }
    }

    void checkSession();
  }, [router]);

  function handleAuthenticated(result: AuthResponse) {
    storeAuthSession(result);
    router.replace("/dashboard");
  }

  if (isCheckingSession) {
    return (
      <RouteLoading
        description="Checking whether you already have a valid session."
        title="Preparing login"
      />
    );
  }

  return (
    <main className="min-h-screen p-5">
      <ThemeToggle className="fixed right-6 top-6 z-30" />
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1240px] overflow-hidden rounded-3xl border bg-card shadow-sm lg:min-h-[calc(100vh-2.5rem)] lg:grid-cols-2">
        <AuthHero />
        <AuthPanel onAuthenticated={handleAuthenticated} />
      </div>
    </main>
  );
}
