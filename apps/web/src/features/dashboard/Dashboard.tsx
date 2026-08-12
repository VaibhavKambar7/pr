"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createPrompt,
  createPromptVersion,
  createProject,
  listPrompts,
  listPromptVersions,
  listProjects,
  promotePromptVersion,
  rollbackPromptVersion,
  type AuthUser,
  type Prompt,
  type PromptVersion,
  type Project,
} from "../../lib/api";

type DashboardProps = {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
};

function parseJsonObject(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("model params must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}

export function Dashboard({ accessToken, user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectMessage, setProjectMessage] = useState("Loading projects...");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptName, setPromptName] = useState("");
  const [promptSlug, setPromptSlug] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [promptMessage, setPromptMessage] = useState("Select a project to load prompts.");
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [versionTemplate, setVersionTemplate] = useState("");
  const [versionModel, setVersionModel] = useState("");
  const [versionModelParams, setVersionModelParams] = useState("{\n  \"temperature\": 0.2\n}");
  const [versionMessage, setVersionMessage] = useState("Select a prompt to load versions.");
  const [isProjectError, setIsProjectError] = useState(false);
  const [isPromptError, setIsPromptError] = useState(false);
  const [isVersionError, setIsVersionError] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [promotingVersion, setPromotingVersion] = useState<number | null>(null);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedPromptId) ?? null;
  const liveVersion = promptVersions.find((promptVersion) => promptVersion.status === "LIVE") ?? null;

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

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId) {
      setPrompts([]);
      setSelectedPromptId(null);
      setPromptMessage("Select a project to load prompts.");
      return;
    }

    async function loadPrompts() {
      if (!selectedProjectId) {
        return;
      }

      setIsLoadingPrompts(true);
      setIsPromptError(false);
      setPromptMessage("Loading prompts...");

      try {
        const result = await listPrompts(accessToken, selectedProjectId);

        if (!isMounted) {
          return;
        }

        setPrompts(result.prompts);
        setSelectedPromptId(result.prompts[0]?.id ?? null);
        setPromptMessage(
          result.prompts.length === 0
            ? "No prompts yet. Create the first prompt in this project."
            : "Prompts loaded.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPrompts([]);
        setSelectedPromptId(null);
        setIsPromptError(true);
        setPromptMessage(error instanceof Error ? error.message : "Failed to load prompts");
      } finally {
        if (isMounted) {
          setIsLoadingPrompts(false);
        }
      }
    }

    void loadPrompts();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId || !selectedPromptId) {
      setPromptVersions([]);
      setVersionMessage("Select a prompt to load versions.");
      return;
    }

    async function loadVersions() {
      if (!selectedProjectId || !selectedPromptId) {
        return;
      }

      setIsLoadingVersions(true);
      setIsVersionError(false);
      setVersionMessage("Loading versions...");

      try {
        const result = await listPromptVersions(accessToken, selectedProjectId, selectedPromptId);

        if (!isMounted) {
          return;
        }

        setPromptVersions(result.promptVersions);
        setVersionMessage(
          result.promptVersions.length === 0
            ? "No versions yet. Create the first immutable template."
            : "Versions loaded.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPromptVersions([]);
        setIsVersionError(true);
        setVersionMessage(error instanceof Error ? error.message : "Failed to load versions");
      } finally {
        if (isMounted) {
          setIsLoadingVersions(false);
        }
      }
    }

    void loadVersions();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId, selectedPromptId]);

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

  async function handleCreatePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setIsPromptError(true);
      setPromptMessage("Create or select a project before adding prompts.");
      return;
    }

    setIsCreatingPrompt(true);
    setIsPromptError(false);
    setPromptMessage("Creating prompt...");

    try {
      const result = await createPrompt(accessToken, selectedProjectId, {
        name: promptName,
        slug: promptSlug || undefined,
        description: promptDescription || undefined,
      });

      setPrompts((currentPrompts) => [result.prompt, ...currentPrompts]);
      setSelectedPromptId(result.prompt.id);
      setPromptName("");
      setPromptSlug("");
      setPromptDescription("");
      setPromptMessage("Prompt created and selected.");
    } catch (error) {
      setIsPromptError(true);
      setPromptMessage(error instanceof Error ? error.message : "Failed to create prompt");
    } finally {
      setIsCreatingPrompt(false);
    }
  }

  async function handleCreateVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !selectedPromptId) {
      setIsVersionError(true);
      setVersionMessage("Select a prompt before creating a version.");
      return;
    }

    setIsCreatingVersion(true);
    setIsVersionError(false);
    setVersionMessage("Creating immutable version...");

    try {
      const modelParams = parseJsonObject(versionModelParams);
      const result = await createPromptVersion(accessToken, selectedProjectId, selectedPromptId, {
        template: versionTemplate,
        model: versionModel || undefined,
        modelParams,
      });

      setPromptVersions((currentVersions) => [result.promptVersion, ...currentVersions]);
      setVersionTemplate("");
      setVersionMessage(`Version ${result.promptVersion.version} created.`);
    } catch (error) {
      setIsVersionError(true);
      setVersionMessage(error instanceof Error ? error.message : "Failed to create version");
    } finally {
      setIsCreatingVersion(false);
    }
  }

  async function handlePromoteVersion(promptVersion: PromptVersion) {
    if (!selectedProjectId || !selectedPromptId) {
      return;
    }

    setPromotingVersion(promptVersion.version);
    setIsVersionError(false);
    setVersionMessage(`Promoting version ${promptVersion.version}...`);

    try {
      const action = promptVersion.status === "LIVE" ? rollbackPromptVersion : promotePromptVersion;
      const result = await action(accessToken, selectedProjectId, selectedPromptId, promptVersion.version);

      setPromptVersions((currentVersions) =>
        currentVersions.map((currentVersion) => {
          if (currentVersion.id === result.promptVersion.id) {
            return result.promptVersion;
          }

          if (currentVersion.status === "LIVE") {
            return {
              ...currentVersion,
              status: "DRAFT",
              promotedAt: null,
            };
          }

          return currentVersion;
        }),
      );
      setVersionMessage(`Version ${result.promptVersion.version} is now live.`);
    } catch (error) {
      setIsVersionError(true);
      setVersionMessage(error instanceof Error ? error.message : "Failed to promote version");
    } finally {
      setPromotingVersion(null);
    }
  }

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
              <span>Live version</span>
              <strong>{liveVersion ? `v${liveVersion.version}` : "none"}</strong>
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

        <section className="registry-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Prompt Registry</span>
              <h2>{selectedProject ? selectedProject.name : "Select a project"}</h2>
              <p>
                Prompts are stable records. The actual prompt text lives in immutable versions below.
              </p>
            </div>

            {isLoadingPrompts ? <p className="status-message">Loading prompts...</p> : null}

            {!isLoadingPrompts && selectedProject && prompts.length === 0 ? (
              <div className="empty-state">
                <strong>No prompts in this project</strong>
                <span>Create a prompt record, then add versioned templates to it.</span>
              </div>
            ) : null}

            {!selectedProject ? (
              <div className="empty-state">
                <strong>No project selected</strong>
                <span>Select or create a project above before adding prompt records.</span>
              </div>
            ) : null}

            <div className="prompt-list">
              {prompts.map((prompt) => (
                <button
                  className={`prompt-card ${prompt.id === selectedPromptId ? "active" : ""}`}
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  type="button"
                >
                  <div>
                    <span>{prompt.slug}</span>
                    <strong>{prompt.name}</strong>
                    <small>{prompt.description || "No description yet"}</small>
                  </div>
                  <em>{prompt.id === selectedPromptId ? "selected" : "registry"}</em>
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Create</span>
              <h2>New prompt</h2>
              <p>Add a named prompt record. Versioned templates are managed below.</p>
            </div>

            <form className="form-stack" onSubmit={handleCreatePrompt}>
              <div className="field">
                <label htmlFor="prompt-name">Prompt name</label>
                <input
                  disabled={!selectedProject}
                  id="prompt-name"
                  minLength={2}
                  onChange={(event) => setPromptName(event.target.value)}
                  placeholder="Support reply generator"
                  required
                  value={promptName}
                />
              </div>

              <div className="field">
                <label htmlFor="prompt-slug">Slug optional</label>
                <input
                  disabled={!selectedProject}
                  id="prompt-slug"
                  minLength={2}
                  onChange={(event) => setPromptSlug(event.target.value)}
                  placeholder="support-reply-generator"
                  value={promptSlug}
                />
              </div>

              <div className="field">
                <label htmlFor="prompt-description">Description optional</label>
                <textarea
                  disabled={!selectedProject}
                  id="prompt-description"
                  maxLength={500}
                  onChange={(event) => setPromptDescription(event.target.value)}
                  placeholder="Creates concise customer support replies using ticket context."
                  rows={4}
                  value={promptDescription}
                />
              </div>

              <button className="primary-button" disabled={!selectedProject || isCreatingPrompt} type="submit">
                {isCreatingPrompt ? "Creating..." : "Create prompt"}
              </button>
            </form>

            <div className="active-record">
              <span>Active prompt</span>
              <strong>{selectedPrompt?.name ?? "none"}</strong>
            </div>

            <p className={`status-message ${isPromptError ? "error" : ""}`}>{promptMessage}</p>
          </div>
        </section>

        <section className="versions-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Versions</span>
              <h2>{selectedPrompt ? selectedPrompt.name : "Select a prompt"}</h2>
              <p>Create immutable templates and choose exactly one live version for runtime use.</p>
            </div>

            {isLoadingVersions ? <p className="status-message">Loading versions...</p> : null}

            {!isLoadingVersions && selectedPrompt && promptVersions.length === 0 ? (
              <div className="empty-state">
                <strong>No versions yet</strong>
                <span>Create v1 on the right. After that, promote it live.</span>
              </div>
            ) : null}

            {!selectedPrompt ? (
              <div className="empty-state">
                <strong>No prompt selected</strong>
                <span>Select or create a prompt above before adding versions.</span>
              </div>
            ) : null}

            <div className="version-list">
              {promptVersions.map((promptVersion) => (
                <article className="version-card" key={promptVersion.id}>
                  <div className="version-card-header">
                    <div>
                      <span className={`status-badge ${promptVersion.status.toLowerCase()}`}>
                        {promptVersion.status}
                      </span>
                      <strong>v{promptVersion.version}</strong>
                    </div>
                    <button
                      className="secondary-button"
                      disabled={promotingVersion === promptVersion.version}
                      onClick={() => void handlePromoteVersion(promptVersion)}
                      type="button"
                    >
                      {promotingVersion === promptVersion.version
                        ? "Working..."
                        : promptVersion.status === "LIVE"
                          ? "Rollback here"
                          : "Make live"}
                    </button>
                  </div>

                  <pre>{promptVersion.template}</pre>
                  <small>
                    {promptVersion.model ? `model: ${promptVersion.model}` : "model not set"} · created{" "}
                    {new Date(promptVersion.createdAt).toLocaleString()}
                  </small>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Create</span>
              <h2>New version</h2>
              <p>Every prompt text change creates a new immutable version.</p>
            </div>

            <form className="form-stack" onSubmit={handleCreateVersion}>
              <div className="field">
                <label htmlFor="version-template">Template</label>
                <textarea
                  disabled={!selectedPrompt}
                  id="version-template"
                  onChange={(event) => setVersionTemplate(event.target.value)}
                  placeholder="Write a concise support reply for {{ customer_name }} about {{ issue }}."
                  required
                  rows={7}
                  value={versionTemplate}
                />
              </div>

              <div className="field">
                <label htmlFor="version-model">Model optional</label>
                <input
                  disabled={!selectedPrompt}
                  id="version-model"
                  onChange={(event) => setVersionModel(event.target.value)}
                  placeholder="gpt-4.1-mini"
                  value={versionModel}
                />
              </div>

              <div className="field">
                <label htmlFor="version-model-params">Model params JSON optional</label>
                <textarea
                  disabled={!selectedPrompt}
                  id="version-model-params"
                  onChange={(event) => setVersionModelParams(event.target.value)}
                  rows={4}
                  value={versionModelParams}
                />
              </div>

              <button
                className="primary-button"
                disabled={!selectedPrompt || isCreatingVersion}
                type="submit"
              >
                {isCreatingVersion ? "Creating..." : "Create version"}
              </button>
            </form>

            <div className="active-record">
              <span>Live version</span>
              <strong>{liveVersion ? `v${liveVersion.version}` : "none"}</strong>
            </div>

            <p className={`status-message ${isVersionError ? "error" : ""}`}>{versionMessage}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
