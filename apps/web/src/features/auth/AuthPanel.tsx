"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { login, register, type AuthResponse } from "@/lib/api";
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
      <section className="flex flex-col justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to Pr</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Manage projects, prompt versions, API keys, and runtime history.
          </p>

          <Tabs
            className="mt-6 gap-0"
            onValueChange={(value) => {
              setMode(value as AuthMode);
              setIsError(false);
              setMessage("Use your API server on port 3001, then sign in here.");
            }}
            value={mode}
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg border bg-secondary p-1">
              <TabsTrigger
                className="rounded-md border-b-0 py-1.5 data-[state=active]:bg-primary data-[state=active]:rounded-md data-[state=active]:border-transparent data-[state=active]:text-primary-foreground data-[state=active]:font-medium"
                disabled={isSubmitting}
                value="login"
              >
                Log in
              </TabsTrigger>
              <TabsTrigger
                className="rounded-md border-b-0 py-1.5 data-[state=active]:bg-primary data-[state=active]:rounded-md data-[state=active]:border-transparent data-[state=active]:text-primary-foreground data-[state=active]:font-medium"
                disabled={isSubmitting}
                value="register"
              >
                Register
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form className="mt-6 grid gap-3.5" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  autoComplete="name"
                  disabled={isSubmitting}
                  id="name"
                  minLength={2}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Vaibhav"
                  required
                  value={name}
                />
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                disabled={isSubmitting}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={isSubmitting}
                id="password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="minimum 8 characters"
                required
                type="password"
                value={password}
              />
            </div>

            <Button className="mt-1.5 h-10" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Working..." : mode === "login" ? "Enter dashboard" : "Create account"}
            </Button>
          </form>

          <p
            className={cn(
              "mt-4 font-mono text-xs leading-relaxed",
              isError ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {message}
          </p>
        </div>
      </section>

      {toastMessage ? (
        <Toast message={toastMessage} onDismiss={() => setToastMessage("")} tone={toastTone} />
      ) : null}
    </>
  );
}
