"use client";

import { FormEvent, useEffect, useState } from "react";
import { getMe, login, register, type AuthUser } from "../lib/api";

type AuthMode = "login" | "register";

const TOKEN_STORAGE_KEY = "promptu.accessToken";

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Use your API server on port 3001, then sign in here.");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      return;
    }

    setAccessToken(storedToken);
    void getMe(storedToken)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setMessage("Session restored.");
        setIsError(false);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAccessToken(null);
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setIsError(false);
    setMessage(mode === "login" ? "Signing you in..." : "Creating your workspace account...");

    try {
      const result =
        mode === "login"
          ? await login({ email, password })
          : await register({
              name,
              email,
              password,
            });

      window.localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
      setAccessToken(result.accessToken);
      setUser(result.user);
      setMessage("You are in. Next up: projects and prompt registry UI.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAccessToken(null);
    setUser(null);
    setPassword("");
    setMessage("Signed out locally.");
    setIsError(false);
  }

  if (accessToken && user) {
    return <DashboardPreview user={user} onLogout={handleLogout} />;
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

        <section className="auth-card">
          <div className="tabs" aria-label="Authentication mode">
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
              Log in
            </button>
            <button
              className={`tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  autoComplete="name"
                  minLength={2}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Vaibhav"
                  required
                  value={name}
                />
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="minimum 8 characters"
                required
                type="password"
                value={password}
              />
            </div>

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Working..." : mode === "login" ? "Enter dashboard" : "Create account"}
            </button>
          </form>

          <p className={`status-message ${isError ? "error" : ""}`}>{message}</p>
        </section>
      </div>
    </main>
  );
}

function DashboardPreview({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <main className="page-shell">
      <div className="dashboard-wrap">
        <section className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <span className="eyebrow">Admin dashboard</span>
              <h1>Welcome, {user.name ?? user.email}.</h1>
              <p>
                Auth is connected. The next slice will add project creation and prompt registry screens
                on top of this shell.
              </p>
            </div>
            <button className="secondary-button" onClick={onLogout}>
              Log out
            </button>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <span>Current module</span>
              <strong>Auth</strong>
            </div>
            <div className="metric-card">
              <span>Next module</span>
              <strong>Projects</strong>
            </div>
            <div className="metric-card">
              <span>API user</span>
              <strong>{user.email}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
