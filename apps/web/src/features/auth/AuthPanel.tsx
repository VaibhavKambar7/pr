"use client";

import { FormEvent, useState } from "react";
import { login, register, type AuthResponse } from "../../lib/api";
import { Toast } from "../feedback/Toast";

type AuthMode = "login" | "register";

type AuthPanelProps = {
  onAuthenticated: (result: AuthResponse) => void;
};

function validateAuthInput(mode: AuthMode, name: string, email: string, password: string) {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (mode === "register" && trimmedName.length < 2) {
    throw new Error("name must be at least 2 characters");
  }

  if (!trimmedEmail.includes("@")) {
    throw new Error("enter a valid email address");
  }

  if (password.length < 8) {
    throw new Error("password must be at least 8 characters");
  }

  return {
    email: trimmedEmail,
    name: trimmedName,
  };
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Use your API server on port 3001, then sign in here.");
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState<"error" | "success">("error");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showToast(nextMessage: string, tone: "error" | "success" = "error") {
    setToastMessage(nextMessage);
    setToastTone(tone);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let input: ReturnType<typeof validateAuthInput>;

    try {
      input = validateAuthInput(mode, name, email, password);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Invalid auth input";
      setIsError(true);
      setMessage(nextMessage);
      showToast(nextMessage);
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setMessage(mode === "login" ? "Signing you in..." : "Creating your workspace account...");

    try {
      const result =
        mode === "login"
          ? await login({ email: input.email, password })
          : await register({
              name: input.name,
              email: input.email,
              password,
            });

      onAuthenticated(result);
      setMessage("You are in. Loading your projects...");
      showToast("Signed in. Opening dashboard...", "success");
    } catch (error) {
      const nextMessage =
        error instanceof TypeError
          ? "Could not reach the API. Check that the API is running and CORS is enabled."
          : error instanceof Error
            ? error.message
            : "Something went wrong";

      setIsError(true);
      setMessage(nextMessage);
      showToast(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="auth-card">
        <div className="tabs" aria-label="Authentication mode">
          <button
            className={`tab ${mode === "login" ? "active" : ""}`}
            disabled={isSubmitting}
            onClick={() => setMode("login")}
            type="button"
          >
            Log in
          </button>
          <button
            className={`tab ${mode === "register" ? "active" : ""}`}
            disabled={isSubmitting}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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

      {toastMessage ? (
        <Toast message={toastMessage} onDismiss={() => setToastMessage("")} tone={toastTone} />
      ) : null}
    </>
  );
}
