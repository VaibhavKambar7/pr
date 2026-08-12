"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createProject,
  getMe,
  listProjects,
  login,
  register,
  type AuthUser,
  type Project,
} from "../lib/api";

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
      setMessage("You are in. Loading your projects...");
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
    return <DashboardPreview accessToken={accessToken} user={user} onLogout={handleLogout} />;
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

function DashboardPreview({
  accessToken,
  user,
  onLogout,
}: {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectMessage, setProjectMessage] = useState("Loading projects...");
  const [isProjectError, setIsProjectError] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setIsLoadingProjects(true);
      setIsProjectError(false);

      try {
        const result = await listProjects(accessToken);

        if (!isMounted) {
          return;
        }

        setProjects(result.projects);
        setSelectedProjectId((currentProjectId) => currentProjectId ?? result.projects[0]?.id ?? null);
        setProjectMessage(
          result.projects.length === 0
            ? "No projects yet. Create your first workspace to start managing prompts."
            : "Projects loaded.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setIsProjectError(true);
        setProjectMessage(error instanceof Error ? error.message : "Failed to load projects");
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingProject(true);
    setIsProjectError(false);
    setProjectMessage("Creating project...");

    try {
      const result = await createProject(accessToken, {
        name: projectName,
        slug: projectSlug || undefined,
        description: projectDescription || undefined,
      });

      setProjects((currentProjects) => [result.project, ...currentProjects]);
      setSelectedProjectId(result.project.id);
      setProjectName("");
      setProjectSlug("");
      setProjectDescription("");
      setProjectMessage("Project created and selected.");
    } catch (error) {
      setIsProjectError(true);
      setProjectMessage(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <main className="page-shell">
      <div className="dashboard-wrap">
        <section className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <span className="eyebrow">Admin dashboard</span>
              <h1>Welcome, {user.name ?? user.email}.</h1>
              <p>
                Create a project workspace first. Every prompt, version, API key, and execution belongs
                to one of these projects.
              </p>
            </div>
            <button className="secondary-button" onClick={onLogout}>
              Log out
            </button>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <span>Total projects</span>
              <strong>{projects.length}</strong>
            </div>
            <div className="metric-card">
              <span>Active project</span>
              <strong>{selectedProject?.slug ?? "none"}</strong>
            </div>
            <div className="metric-card">
              <span>API user</span>
              <strong>{user.email}</strong>
            </div>
          </div>
        </section>

        <section className="workspace-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Projects</span>
              <h2>Workspaces</h2>
              <p>Select the workspace your application will use at runtime.</p>
            </div>

            {isLoadingProjects ? <p className="status-message">Loading projects...</p> : null}

            {!isLoadingProjects && projects.length === 0 ? (
              <div className="empty-state">
                <strong>No projects yet</strong>
                <span>Create one on the right. Then we can add prompts inside it.</span>
              </div>
            ) : null}

            <div className="project-list">
              {projects.map((project) => (
                <button
                  className={`project-card ${project.id === selectedProjectId ? "active" : ""}`}
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
                  <span>{project.slug}</span>
                  <strong>{project.name}</strong>
                  <small>{project.description || "No description yet"}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Create</span>
              <h2>New project</h2>
              <p>This becomes the parent workspace for prompts and API keys.</p>
            </div>

            <form className="form-stack" onSubmit={handleCreateProject}>
              <div className="field">
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  minLength={2}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Customer Support AI"
                  required
                  value={projectName}
                />
              </div>

              <div className="field">
                <label htmlFor="project-slug">Slug optional</label>
                <input
                  id="project-slug"
                  minLength={2}
                  onChange={(event) => setProjectSlug(event.target.value)}
                  placeholder="customer-support-ai"
                  value={projectSlug}
                />
              </div>

              <div className="field">
                <label htmlFor="project-description">Description optional</label>
                <textarea
                  id="project-description"
                  maxLength={500}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  placeholder="Prompts used by the support automation service."
                  rows={4}
                  value={projectDescription}
                />
              </div>

              <button className="primary-button" disabled={isCreatingProject} type="submit">
                {isCreatingProject ? "Creating..." : "Create project"}
              </button>
            </form>

            <p className={`status-message ${isProjectError ? "error" : ""}`}>{projectMessage}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
