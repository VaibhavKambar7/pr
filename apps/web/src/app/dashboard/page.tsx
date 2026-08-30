"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConsoleApp } from "@/features/console/ConsoleApp";
import { RouteLoading } from "@/features/navigation/RouteLoading";
import { getMe, logoutSession, refreshSession, type AuthUser } from "@/lib/api";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthSession,
} from "@/lib/auth-session";

export default function DashboardPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (!token && !refreshToken) {
      router.replace("/login");
      return;
    }

    async function loadSession() {
      try {
        if (token) {
          setAccessToken(token);
          const { user: currentUser } = await getMe(token);
          setUser(currentUser);
          return;
        }

        if (refreshToken) {
          const refreshedSession = await refreshSession(refreshToken);
          storeAuthSession(refreshedSession);
          setAccessToken(refreshedSession.accessToken);
          setUser(refreshedSession.user);
        }
      } catch {
        clearAuthSession();
        router.replace("/login");
      }
    }

    void loadSession();
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    const refreshToken = getStoredRefreshToken();

    if (refreshToken) {
      await logoutSession(refreshToken).catch(() => undefined);
    }

    clearAuthSession();
    router.replace("/login");
  }

  if (isLoggingOut) {
    return <RouteLoading description="Clearing your local session and returning to login." title="Logging out" />;
  }

  if (!accessToken || !user) {
    return (
      <RouteLoading
        description="Restoring your session and loading the admin workspace."
        title="Loading dashboard"
      />
    );
  }

  return <ConsoleApp accessToken={accessToken} user={user} onLogout={handleLogout} />;
}
