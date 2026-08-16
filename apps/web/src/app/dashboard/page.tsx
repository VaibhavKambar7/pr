"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "../../features/dashboard/Dashboard";
import { RouteLoading } from "../../features/navigation/RouteLoading";
import { getMe, type AuthUser } from "../../lib/api";
import { clearAuthSession, getStoredAccessToken } from "../../lib/auth-session";

export default function DashboardPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setAccessToken(token);
    void getMe(token)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        clearAuthSession();
        router.replace("/login");
      });
  }, [router]);

  function handleLogout() {
    setIsLoggingOut(true);
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

  return <Dashboard accessToken={accessToken} user={user} onLogout={handleLogout} />;
}
