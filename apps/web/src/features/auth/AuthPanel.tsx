"use client";

import { FormEvent, useState } from "react";
import { login, register, type AuthResponse } from "../../lib/api";

type AuthMode = "login" | "register";

type AuthPanelProps = {
  onAuthenticated: (result: AuthResponse) => void;
};

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Use your API server on port 3001, then sign in here.");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      onAuthenticated(result);
      setMessage("You are in. Loading your projects...");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="tabs" aria-label="Authentication mode">
        <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
          Log in
        </button>
        <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
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
  );
}
