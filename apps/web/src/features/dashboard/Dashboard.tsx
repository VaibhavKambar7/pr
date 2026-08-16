"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createApiKey,
  createPrompt,
  createPromptVersion,
  createProject,
  getExecution,
  listApiKeys,
  listExecutions,
  listPrompts,
  listPromptVersions,
  listProjects,
  promotePromptVersion,
  renderLivePrompt,
  revokeApiKey,
  rollbackPromptVersion,
  type ApiKey,
  type AuthUser,
  type ExecutionDetail,
  type ExecutionListItem,
  type Prompt,
  type PromptVersion,
  type Project,
  type RuntimeRenderResult,
} from "../../lib/api";
import { parseJsonObject, parseTemplateVariables } from "../../lib/json";
import {
  ApiKeysSection,
  DashboardSummary,
  ExecutionHistorySection,
  ProjectSection,
  PromptRegistrySection,
  PromptVersionsSection,
  RuntimeRenderSection,
} from "./DashboardSections";

type DashboardProps = {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateName(value: string, label: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length < 2) {
    throw new Error(`${label} must be at least 2 characters`);
  }

  return trimmedValue;
}

function validateOptionalSlug(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (!SLUG_PATTERN.test(trimmedValue)) {
    throw new Error("slug must use lowercase letters, numbers, and hyphens");
  }

  return trimmedValue;
}

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
  const [executions, setExecutions] = useState<ExecutionListItem[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [executionDetail, setExecutionDetail] = useState<ExecutionDetail | null>(null);
  const [executionMessage, setExecutionMessage] = useState("Select a project to load execution history.");
  const [isProjectError, setIsProjectError] = useState(false);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const [isPromptError, setIsPromptError] = useState(false);
  const [isVersionError, setIsVersionError] = useState(false);
  const [isRuntimeError, setIsRuntimeError] = useState(false);
  const [isExecutionError, setIsExecutionError] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isLoadingExecutionDetail, setIsLoadingExecutionDetail] = useState(false);
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
    let isMounted = true;

    if (!selectedProjectId) {
      setExecutions([]);
      setSelectedExecutionId(null);
      setExecutionDetail(null);
      setExecutionMessage("Select a project to load execution history.");
      return;
    }

    async function loadExecutionHistory() {
      if (!selectedProjectId) {
        return;
      }

      setIsLoadingExecutions(true);
      setIsExecutionError(false);
      setExecutionMessage("Loading execution history...");

      try {
        const result = await listExecutions(accessToken, selectedProjectId, selectedPromptId ?? undefined);

        if (!isMounted) {
          return;
        }

        setExecutions(result.executions);
        setSelectedExecutionId((currentExecutionId) => {
          if (currentExecutionId && result.executions.some((execution) => execution.id === currentExecutionId)) {
            return currentExecutionId;
          }

          return result.executions[0]?.id ?? null;
        });
        setExecutionMessage(
          result.executions.length === 0
            ? "No executions yet. Render a live prompt to create one."
            : "Execution history loaded.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setExecutions([]);
        setSelectedExecutionId(null);
        setExecutionDetail(null);
        setIsExecutionError(true);
        setExecutionMessage(error instanceof Error ? error.message : "Failed to load execution history");
      } finally {
        if (isMounted) {
          setIsLoadingExecutions(false);
        }
      }
    }

    void loadExecutionHistory();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId, selectedPromptId]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId || !selectedExecutionId) {
      setExecutionDetail(null);
      return;
    }

    async function loadExecutionDetail() {
      if (!selectedProjectId || !selectedExecutionId) {
        return;
      }

      setIsLoadingExecutionDetail(true);
      setIsExecutionError(false);

      try {
        const result = await getExecution(accessToken, selectedProjectId, selectedExecutionId);

        if (!isMounted) {
          return;
        }

        setExecutionDetail(result.execution);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setExecutionDetail(null);
        setIsExecutionError(true);
        setExecutionMessage(error instanceof Error ? error.message : "Failed to load execution detail");
      } finally {
        if (isMounted) {
          setIsLoadingExecutionDetail(false);
        }
      }
    }

    void loadExecutionDetail();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId, selectedExecutionId]);

  useEffect(() => {
    setRenderResult(null);
    setIsRuntimeError(false);
    setRuntimeMessage(liveVersion ? "Ready to render the live prompt." : "Promote a live version, then render it here.");
  }, [liveVersion?.id, selectedProjectId, selectedPromptId]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let name: string;
    let slug: string | undefined;

    try {
      name = validateName(projectName, "project name");
      slug = validateOptionalSlug(projectSlug);
    } catch (error) {
      setIsProjectError(true);
      setProjectMessage(error instanceof Error ? error.message : "Invalid project input");
      return;
    }

    setIsCreatingProject(true);
    setIsProjectError(false);
    setProjectMessage("Creating project...");

    try {
      const result = await createProject(accessToken, {
        name,
        slug,
        description: projectDescription.trim() || undefined,
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

    let name: string;

    try {
      name = validateName(apiKeyName, "api key name");
    } catch (error) {
      setIsApiKeyError(true);
      setApiKeyMessage(error instanceof Error ? error.message : "Invalid API key input");
      return;
    }

    setIsCreatingApiKey(true);
    setIsApiKeyError(false);
    setNewRawApiKey(null);
    setApiKeyMessage("Creating API key...");

    try {
      const result = await createApiKey(accessToken, selectedProjectId, {
        name,
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

    let name: string;
    let slug: string | undefined;

    try {
      name = validateName(promptName, "prompt name");
      slug = validateOptionalSlug(promptSlug);
    } catch (error) {
      setIsPromptError(true);
      setPromptMessage(error instanceof Error ? error.message : "Invalid prompt input");
      return;
    }

    setIsCreatingPrompt(true);
    setIsPromptError(false);
    setPromptMessage("Creating prompt...");

    try {
      const result = await createPrompt(accessToken, selectedProjectId, {
        name,
        slug,
        description: promptDescription.trim() || undefined,
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

    const template = versionTemplate.trim();
    const model = versionModel.trim();

    if (template.length < 3) {
      setIsVersionError(true);
      setVersionMessage("template must be at least 3 characters");
      return;
    }

    setIsCreatingVersion(true);
    setIsVersionError(false);
    setVersionMessage("Creating immutable version...");

    try {
      const modelParams = parseJsonObject(versionModelParams, "model params");
      const result = await createPromptVersion(accessToken, selectedProjectId, selectedPromptId, {
        template,
        model: model || undefined,
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
      setExecutions((currentExecutions) => [
        {
          id: result.executionId,
          latencyMs: null,
          output: null,
          error: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          costUsd: null,
          createdAt: new Date().toISOString(),
          prompt: {
            id: result.prompt.id,
            name: result.prompt.name,
            slug: result.prompt.slug,
          },
          promptVersion: {
            id: result.promptVersion.id,
            version: result.promptVersion.version,
            status: result.promptVersion.status,
            model: result.promptVersion.model,
          },
          apiKey: null,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        ...currentExecutions.filter((execution) => execution.id !== result.executionId),
      ]);
      setSelectedExecutionId(result.executionId);
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
        <DashboardSummary
          liveVersion={liveVersion}
          onLogout={onLogout}
          projects={projects}
          selectedProject={selectedProject}
          user={user}
        />

        <ProjectSection
          isCreatingProject={isCreatingProject}
          isLoadingProjects={isLoadingProjects}
          isProjectError={isProjectError}
          onCreateProject={handleCreateProject}
          onProjectDescriptionChange={setProjectDescription}
          onProjectNameChange={setProjectName}
          onProjectSlugChange={setProjectSlug}
          onSelectProject={setSelectedProjectId}
          projectDescription={projectDescription}
          projectMessage={projectMessage}
          projectName={projectName}
          projectSlug={projectSlug}
          projects={projects}
          selectedProjectId={selectedProjectId}
        />

        <ApiKeysSection
          apiKeyMessage={apiKeyMessage}
          apiKeyName={apiKeyName}
          apiKeys={apiKeys}
          isApiKeyError={isApiKeyError}
          isCreatingApiKey={isCreatingApiKey}
          isLoadingApiKeys={isLoadingApiKeys}
          newRawApiKey={newRawApiKey}
          onApiKeyNameChange={setApiKeyName}
          onCreateApiKey={handleCreateApiKey}
          onRevokeApiKey={(apiKey) => void handleRevokeApiKey(apiKey)}
          revokingApiKeyId={revokingApiKeyId}
          selectedProject={selectedProject}
        />

        <PromptRegistrySection
          isCreatingPrompt={isCreatingPrompt}
          isLoadingPrompts={isLoadingPrompts}
          isPromptError={isPromptError}
          onCreatePrompt={handleCreatePrompt}
          onPromptDescriptionChange={setPromptDescription}
          onPromptNameChange={setPromptName}
          onPromptSlugChange={setPromptSlug}
          onSelectPrompt={setSelectedPromptId}
          promptDescription={promptDescription}
          promptMessage={promptMessage}
          promptName={promptName}
          prompts={prompts}
          promptSlug={promptSlug}
          selectedProject={selectedProject}
          selectedPrompt={selectedPrompt}
          selectedPromptId={selectedPromptId}
        />

        <PromptVersionsSection
          isCreatingVersion={isCreatingVersion}
          isLoadingVersions={isLoadingVersions}
          isVersionError={isVersionError}
          liveVersion={liveVersion}
          onCreateVersion={handleCreateVersion}
          onPromoteVersion={(promptVersion) => void handlePromoteVersion(promptVersion)}
          onVersionModelChange={setVersionModel}
          onVersionModelParamsChange={setVersionModelParams}
          onVersionTemplateChange={setVersionTemplate}
          promotingVersion={promotingVersion}
          promptVersions={promptVersions}
          selectedPrompt={selectedPrompt}
          versionMessage={versionMessage}
          versionModel={versionModel}
          versionModelParams={versionModelParams}
          versionTemplate={versionTemplate}
        />

        <RuntimeRenderSection
          isRenderingPrompt={isRenderingPrompt}
          isRuntimeError={isRuntimeError}
          liveVersion={liveVersion}
          onRenderLivePrompt={handleRenderLivePrompt}
          onRuntimeVariablesChange={setRuntimeVariables}
          renderResult={renderResult}
          runtimeMessage={runtimeMessage}
          runtimeVariables={runtimeVariables}
          selectedProject={selectedProject}
          selectedPrompt={selectedPrompt}
        />

        <ExecutionHistorySection
          executionDetail={executionDetail}
          executionMessage={executionMessage}
          executions={executions}
          isExecutionError={isExecutionError}
          isLoadingExecutionDetail={isLoadingExecutionDetail}
          isLoadingExecutions={isLoadingExecutions}
          onSelectExecution={setSelectedExecutionId}
          selectedExecutionId={selectedExecutionId}
          selectedProject={selectedProject}
        />
      </div>
    </main>
  );
}
