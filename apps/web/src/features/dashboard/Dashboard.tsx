"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createApiKey,
  createPrompt,
  createPromptVersion,
  createProject,
  listApiKeys,
  listPrompts,
  listPromptVersions,
  listProjects,
  promotePromptVersion,
  renderLivePrompt,
  revokeApiKey,
  rollbackPromptVersion,
  type ApiKey,
  type AuthUser,
  type Prompt,
  type PromptVersion,
  type Project,
  type RuntimeRenderResult,
} from "../../lib/api";
import { parseJsonObject, parseTemplateVariables } from "../../lib/json";

type DashboardProps = {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
};

export function Dashboard({ accessToken, user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectMessage, setProjectMessage] = useState("Loading projects...");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyMessage, setApiKeyMessage] = useState("Select a project to load API keys.");
  const [newRawApiKey, setNewRawApiKey] = useState<string | null>(null);
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
  const [runtimeVariables, setRuntimeVariables] = useState("{\n  \"customer_name\": \"Asha\",\n  \"issue\": \"a delayed order\"\n}");
  const [runtimeMessage, setRuntimeMessage] = useState("Promote a live version, then render it here.");
  const [renderResult, setRenderResult] = useState<RuntimeRenderResult | null>(null);
  const [isProjectError, setIsProjectError] = useState(false);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const [isPromptError, setIsPromptError] = useState(false);
  const [isVersionError, setIsVersionError] = useState(false);
  const [isRuntimeError, setIsRuntimeError] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isRenderingPrompt, setIsRenderingPrompt] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<string | null>(null);
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
      setApiKeys([]);
      setNewRawApiKey(null);
      setApiKeyMessage("Select a project to load API keys.");
      return;
    }

    async function loadProjectApiKeys() {
      if (!selectedProjectId) {
        return;
      }

      setIsLoadingApiKeys(true);
      setIsApiKeyError(false);
      setNewRawApiKey(null);
      setApiKeyMessage("Loading API keys...");

      try {
        const result = await listApiKeys(accessToken, selectedProjectId);

        if (!isMounted) {
          return;
        }

        setApiKeys(result.apiKeys);
        setApiKeyMessage(
          result.apiKeys.length === 0
            ? "No API keys yet. Create one so applications can call runtime endpoints."
            : "API keys loaded.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setApiKeys([]);
        setIsApiKeyError(true);
        setApiKeyMessage(error instanceof Error ? error.message : "Failed to load API keys");
      } finally {
        if (isMounted) {
          setIsLoadingApiKeys(false);
        }
      }
    }

    void loadProjectApiKeys();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId]);

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

  useEffect(() => {
    setRenderResult(null);
    setIsRuntimeError(false);
    setRuntimeMessage(liveVersion ? "Ready to render the live prompt." : "Promote a live version, then render it here.");
  }, [liveVersion?.id, selectedProjectId, selectedPromptId]);

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

  async function handleCreateApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setIsApiKeyError(true);
      setApiKeyMessage("Select a project before creating an API key.");
      return;
    }

    setIsCreatingApiKey(true);
    setIsApiKeyError(false);
    setNewRawApiKey(null);
    setApiKeyMessage("Creating API key...");

    try {
      const result = await createApiKey(accessToken, selectedProjectId, {
        name: apiKeyName,
      });

      setApiKeys((currentApiKeys) => [result.apiKey, ...currentApiKeys]);
      setNewRawApiKey(result.key);
      setApiKeyName("");
      setApiKeyMessage("API key created. Copy the raw key now; it will not be shown again.");
    } catch (error) {
      setIsApiKeyError(true);
      setApiKeyMessage(error instanceof Error ? error.message : "Failed to create API key");
    } finally {
      setIsCreatingApiKey(false);
    }
  }

  async function handleRevokeApiKey(apiKey: ApiKey) {
    if (!selectedProjectId || apiKey.revokedAt) {
      return;
    }

    setRevokingApiKeyId(apiKey.id);
    setIsApiKeyError(false);
    setApiKeyMessage(`Revoking ${apiKey.name}...`);

    try {
      await revokeApiKey(accessToken, selectedProjectId, apiKey.id);

      const revokedAt = new Date().toISOString();
      setApiKeys((currentApiKeys) =>
        currentApiKeys.map((currentApiKey) =>
          currentApiKey.id === apiKey.id
            ? {
                ...currentApiKey,
                revokedAt,
              }
            : currentApiKey,
        ),
      );
      setApiKeyMessage(`${apiKey.name} revoked.`);
    } catch (error) {
      setIsApiKeyError(true);
      setApiKeyMessage(error instanceof Error ? error.message : "Failed to revoke API key");
    } finally {
      setRevokingApiKeyId(null);
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
      const modelParams = parseJsonObject(versionModelParams, "model params");
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

  async function handleRenderLivePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !selectedPromptId) {
      setIsRuntimeError(true);
      setRuntimeMessage("Select a project and prompt before rendering.");
      return;
    }

    if (!liveVersion) {
      setIsRuntimeError(true);
      setRuntimeMessage("Promote a version to live before rendering.");
      return;
    }

    setIsRenderingPrompt(true);
    setIsRuntimeError(false);
    setRuntimeMessage("Rendering live prompt...");

    try {
      const variables = parseTemplateVariables(runtimeVariables);
      const result = await renderLivePrompt(accessToken, selectedProjectId, selectedPromptId, {
        variables,
      });

      setRenderResult(result);
      setRuntimeMessage(`Rendered live version v${result.promptVersion.version}.`);
    } catch (error) {
      setRenderResult(null);
      setIsRuntimeError(true);
      setRuntimeMessage(error instanceof Error ? error.message : "Failed to render live prompt");
    } finally {
      setIsRenderingPrompt(false);
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

        <section className="api-keys-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Application Access</span>
              <h2>API keys</h2>
              <p>
                External services use these keys as bearer tokens to fetch or render live prompts at
                runtime.
              </p>
            </div>

            {isLoadingApiKeys ? <p className="status-message">Loading API keys...</p> : null}

            {!isLoadingApiKeys && selectedProject && apiKeys.length === 0 ? (
              <div className="empty-state">
                <strong>No API keys yet</strong>
                <span>Create one on the right before wiring another app to runtime endpoints.</span>
              </div>
            ) : null}

            {!selectedProject ? (
              <div className="empty-state">
                <strong>No project selected</strong>
                <span>Select or create a project before managing API keys.</span>
              </div>
            ) : null}

            <div className="api-key-list">
              {apiKeys.map((apiKey) => (
                <article className={`api-key-card ${apiKey.revokedAt ? "revoked" : ""}`} key={apiKey.id}>
                  <div>
                    <span>{apiKey.revokedAt ? "revoked" : "active"}</span>
                    <strong>{apiKey.name}</strong>
                    <small>
                      prefix {apiKey.prefix} · created {new Date(apiKey.createdAt).toLocaleString()}
                    </small>
                    <small>
                      {apiKey.lastUsedAt
                        ? `last used ${new Date(apiKey.lastUsedAt).toLocaleString()}`
                        : "not used yet"}
                    </small>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={Boolean(apiKey.revokedAt) || revokingApiKeyId === apiKey.id}
                    onClick={() => void handleRevokeApiKey(apiKey)}
                    type="button"
                  >
                    {revokingApiKeyId === apiKey.id ? "Revoking..." : apiKey.revokedAt ? "Revoked" : "Revoke"}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Create</span>
              <h2>New API key</h2>
              <p>The raw key is shown once. Store it in the calling application's environment.</p>
            </div>

            <form className="form-stack" onSubmit={handleCreateApiKey}>
              <div className="field">
                <label htmlFor="api-key-name">Key name</label>
                <input
                  disabled={!selectedProject}
                  id="api-key-name"
                  minLength={2}
                  onChange={(event) => setApiKeyName(event.target.value)}
                  placeholder="support-service-dev"
                  required
                  value={apiKeyName}
                />
              </div>

              <button
                className="primary-button"
                disabled={!selectedProject || isCreatingApiKey}
                type="submit"
              >
                {isCreatingApiKey ? "Creating..." : "Create API key"}
              </button>
            </form>

            {newRawApiKey ? (
              <div className="secret-panel">
                <span>Raw key shown once</span>
                <code>{newRawApiKey}</code>
              </div>
            ) : (
              <div className="active-record">
                <span>Runtime header</span>
                <strong>Authorization: Bearer pr_...</strong>
              </div>
            )}

            <p className={`status-message ${isApiKeyError ? "error" : ""}`}>{apiKeyMessage}</p>
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

        <section className="runtime-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <span className="eyebrow">Runtime</span>
              <h2>Render live prompt</h2>
              <p>
                This simulates what an application does at runtime: ask Promptu for the current live
                prompt without redeploying.
              </p>
            </div>

            <form className="form-stack" onSubmit={handleRenderLivePrompt}>
              <div className="field">
                <label htmlFor="runtime-variables">Variables JSON</label>
                <textarea
                  disabled={!selectedPrompt || !liveVersion}
                  id="runtime-variables"
                  onChange={(event) => setRuntimeVariables(event.target.value)}
                  rows={7}
                  value={runtimeVariables}
                />
              </div>

              <button
                className="primary-button"
                disabled={!selectedPrompt || !liveVersion || isRenderingPrompt}
                type="submit"
              >
                {isRenderingPrompt ? "Rendering..." : "Render live prompt"}
              </button>
            </form>

            <div className="active-record">
              <span>Runtime target</span>
              <strong>
                {selectedProject?.slug && selectedPrompt?.slug
                  ? `${selectedProject.slug}/${selectedPrompt.slug}`
                  : "none"}
              </strong>
            </div>

            <p className={`status-message ${isRuntimeError ? "error" : ""}`}>{runtimeMessage}</p>
          </div>

          <div className="dashboard-card render-output-card">
            <div className="section-heading">
              <span className="eyebrow">Output</span>
              <h2>Rendered prompt</h2>
              <p>The render call also creates an execution-history record.</p>
            </div>

            {renderResult ? (
              <>
                <div className="active-record">
                  <span>Execution ID</span>
                  <strong>{renderResult.executionId}</strong>
                </div>

                <div className="active-record">
                  <span>Live version used</span>
                  <strong>v{renderResult.promptVersion.version}</strong>
                </div>

                <pre className="rendered-prompt">{renderResult.renderedPrompt}</pre>
              </>
            ) : (
              <div className="empty-state">
                <strong>No render yet</strong>
                <span>Render the live prompt to preview the final text and create an execution record.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
