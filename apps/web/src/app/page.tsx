"use client";

import { useEffect, useState } from "react";
import { AuthPanel } from "../features/auth/AuthPanel";
import { Dashboard } from "../features/dashboard/Dashboard";
import { getMe, type AuthResponse, type AuthUser } from "../lib/api";

const TOKEN_STORAGE_KEY = "promptu.accessToken";

export default function HomePage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      return;
    }

    setAccessToken(storedToken);
    void getMe(storedToken)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAccessToken(null);
      });
  }, []);

  function handleAuthenticated(result: AuthResponse) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
    setAccessToken(result.accessToken);
    setUser(result.user);
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAccessToken(null);
    setUser(null);
  }

  if (accessToken && user) {
    return <Dashboard accessToken={accessToken} user={user} onLogout={handleLogout} />;
  }

  return (
    <main className="page-shell">
      <div className="hero-grid">
        <section className="brand-card">
          <span className="eyebrow">Prompt infrastructure, not prompt chaos</span>
          <h1 className="hero-title">Ship prompts like product code.</h1>
          <p className="hero-copy">
            Promptu lets teams manage live prompt versions outside app deploys, with runtime delivery,
            API keys, rollback, and execution history baked into the workflow.
          </p>

          <div className="feature-row">
            <div className="feature-pill">
              <strong>Registry</strong>
              <span>Create prompt records and immutable versions per project.</span>
            </div>
            <div className="feature-pill">
              <strong>Runtime</strong>
              <span>Fetch or render the live version from another application.</span>
            </div>
            <div className="feature-pill">
              <strong>History</strong>
              <span>Track prompt usage, variables, latency, and API-key attribution.</span>
            </div>
          </div>
        </section>

        <AuthPanel onAuthenticated={handleAuthenticated} />
      </div>
    </main>
  );
}
