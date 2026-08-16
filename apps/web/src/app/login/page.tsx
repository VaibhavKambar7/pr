"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHero } from "../../features/auth/AuthHero";
import { AuthPanel } from "../../features/auth/AuthPanel";
import { RouteLoading } from "../../features/navigation/RouteLoading";
import { getMe, type AuthResponse } from "../../lib/api";
import { getStoredAccessToken, storeAuthSession } from "../../lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const token = getStoredAccessToken();

    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    void getMe(token)
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        setIsCheckingSession(false);
      });
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
    <main className="page-shell">
      <div className="hero-grid">
        <AuthHero />
        <AuthPanel onAuthenticated={handleAuthenticated} />
      </div>
    </main>
  );
}
