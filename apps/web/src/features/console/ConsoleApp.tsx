"use client";

import { ChevronDown, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createApiKey,
  createPrompt,
  createPromptVersion,
  createProject,
  getExecution,
  listApiKeys,
  listExecutions,
  listPrompts,
  listPromptTags,
  listProjects,
  listPromptVersions,
  promotePromptVersion,
  removeVersionTag,
  renderLivePrompt,
  revokeApiKey,
  rollbackPromptVersion,
  setVersionTag,
  type ApiKey,
  type AuthUser,
  type ExecutionDetail,
  type ExecutionListItem,
  type Prompt,
  type PromptVersion,
  type PromptVersionTag,
  type Project,
  type RuntimeRenderResult,
} from "@/lib/api";
import { versionIdempotencyKey } from "@/lib/crypto";
import { parseJsonObject, parseTemplateVariables } from "@/lib/json";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../theme/ThemeToggle";
import {
  ExecutionHistory,
  RuntimePanel,
  TemplateBlock,
  VersionLedger,
  timeAgo,
  type StatusMessage,
} from "./ConsolePanels";

type TabId = "versions" | "runtime" | "history";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "versions", label: "Versions" },
  { id: "runtime", label: "Runtime" },
  { id: "history", label: "History" },
];

const DEFAULT_MODEL_PARAMS = `{
  "temperature": 0.2
}`;

const DEFAULT_RUNTIME_VARIABLES = `{
  "customer_name": "Asha",
  "issue": "a delayed order"
}`;

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

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function initials(user: AuthUser) {
  const source = user.name?.trim() || user.email;

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type ConsoleAppProps = {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
};

export function ConsoleApp({ accessToken, user, onLogout }: ConsoleAppProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isPromptComposerOpen, setIsPromptComposerOpen] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [promptTags, setPromptTags] = useState<PromptVersionTag[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isVersionComposerOpen, setIsVersionComposerOpen] = useState(false);
  const [versionTemplate, setVersionTemplate] = useState("");
  const [versionModel, setVersionModel] = useState("");
  const [versionModelParams, setVersionModelParams] = useState(DEFAULT_MODEL_PARAMS);
  const [versionVariableSchema, setVersionVariableSchema] = useState("");
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [promotingVersion, setPromotingVersion] = useState<number | null>(null);
  const [versionMessage, setVersionMessage] = useState<StatusMessage>({
    text: "Select a prompt to load versions.",
    isError: false,
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isKeyComposerOpen, setIsKeyComposerOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [newRawApiKey, setNewRawApiKey] = useState<string | null>(null);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [runtimeVariables, setRuntimeVariables] = useState(DEFAULT_RUNTIME_VARIABLES);
  const [renderResult, setRenderResult] = useState<RuntimeRenderResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [runtimeMessage, setRuntimeMessage] = useState<StatusMessage>({
    text: "Promote a live version, then render it here.",
    isError: false,
  });

  const [executions, setExecutions] = useState<ExecutionListItem[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [executionDetail, setExecutionDetail] = useState<ExecutionDetail | null>(null);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isLoadingExecutionDetail, setIsLoadingExecutionDetail] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>("versions");

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedPrompt = prompts.find((item) => item.id === selectedPromptId) ?? null;
  const liveVersion = promptVersions.find((version) => version.status === "LIVE") ?? null;
  const heroTemplate = liveVersion?.template ?? promptVersions[0]?.template ?? null;

  useEffect(() => {
    if (!projectMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;

      if (!target.closest(".pv2-switcher-wrap")) {
        setProjectMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProjectMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [projectMenuOpen]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const result = await listProjects(accessToken);

        if (!isMounted) {
          return;
        }

        setProjects(result.projects);
        setSelectedProjectId((current) => current ?? result.projects[0]?.id ?? null);
      } catch {
        if (isMounted) {
          setProjects([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId) {
      setPrompts([]);
      setSelectedPromptId(null);
      return;
    }

    async function load() {
      setIsLoadingPrompts(true);

      try {
        const result = await listPrompts(accessToken, selectedProjectId as string);

        if (!isMounted) {
          return;
        }

        setPrompts(result.prompts);
        setSelectedPromptId(result.prompts[0]?.id ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setPrompts([]);
        setSelectedPromptId(null);
      } finally {
        if (isMounted) {
          setIsLoadingPrompts(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId || !selectedPromptId) {
      setPromptVersions([]);
      setPromptTags([]);
      return;
    }

    async function load() {
      setIsLoadingVersions(true);

      try {
        const [versionsResult, tagsResult] = await Promise.all([
          listPromptVersions(accessToken, selectedProjectId as string, selectedPromptId as string),
          listPromptTags(accessToken, selectedProjectId as string, selectedPromptId as string),
        ]);

        if (!isMounted) {
          return;
        }

        setPromptVersions(versionsResult.promptVersions);
        setPromptTags(tagsResult.tags);
      } catch {
        if (!isMounted) {
          return;
        }

        setPromptVersions([]);
        setPromptTags([]);
      } finally {
        if (isMounted) {
          setIsLoadingVersions(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId, selectedPromptId]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId) {
      setApiKeys([]);
      setNewRawApiKey(null);
      return;
    }

    async function load() {
      setIsLoadingApiKeys(true);

      try {
        const result = await listApiKeys(accessToken, selectedProjectId as string);

        if (!isMounted) {
          return;
        }

        setApiKeys(result.apiKeys);
      } catch {
        if (!isMounted) {
          return;
        }

        setApiKeys([]);
      } finally {
        if (isMounted) {
          setIsLoadingApiKeys(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProjectId) {
      setExecutions([]);
      setSelectedExecutionId(null);
      setExecutionDetail(null);
      return;
    }

    async function load() {
      setIsLoadingExecutions(true);

      try {
        const result = await listExecutions(
          accessToken,
          selectedProjectId as string,
          selectedPromptId ?? undefined,
        );

        if (!isMounted) {
          return;
        }

        setExecutions(result.executions);
        setSelectedExecutionId(result.executions[0]?.id ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setExecutions([]);
        setSelectedExecutionId(null);
        setExecutionDetail(null);
      } finally {
        if (isMounted) {
          setIsLoadingExecutions(false);
        }
      }
    }

    void load();

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

    async function load() {
      setIsLoadingExecutionDetail(true);

      try {
        const result = await getExecution(
          accessToken,
          selectedProjectId as string,
          selectedExecutionId as string,
        );

        if (!isMounted) {
          return;
        }

        setExecutionDetail(result.execution);
      } catch {
        if (!isMounted) {
          return;
        }

        setExecutionDetail(null);
      } finally {
        if (isMounted) {
          setIsLoadingExecutionDetail(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedProjectId, selectedExecutionId]);

  useEffect(() => {
    setRenderResult(null);
    setRuntimeMessage({
      text: liveVersion
        ? "Ready to render the live prompt."
        : "Promote a live version, then render it here.",
      isError: false,
    });
  }, [liveVersion?.id, selectedProjectId, selectedPromptId]);

  const activeKeyCount = apiKeys.filter((key) => !key.revokedAt).length;
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const composerState = useMemo(
    () => ({
      isOpen: isVersionComposerOpen,
      template: versionTemplate,
      model: versionModel,
      modelParams: versionModelParams,
      variableSchema: versionVariableSchema,
    }),
    [
      isVersionComposerOpen,
      versionTemplate,
      versionModel,
      versionModelParams,
      versionVariableSchema,
    ],
  );

  function handleSelectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setProjectMenuOpen(false);
    setIsPromptComposerOpen(false);
    setIsVersionComposerOpen(false);
    setActiveTab("versions");
  }

  function handleSelectPrompt(promptId: string) {
    setSelectedPromptId(promptId);
    setActiveTab("versions");
  }

  function resetProjectFields() {
    setProjectName("");
    setProjectSlug("");
    setProjectDescription("");
    setProjectError(null);
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let name: string;
    let slug: string | undefined;

    try {
      name = validateName(projectName, "project name");
      slug = validateOptionalSlug(projectSlug);
    } catch (error) {
      setProjectError(errorMessage(error, "Invalid project input"));
      return;
    }

    setIsCreatingProject(true);
    setProjectError(null);

    try {
      const result = await createProject(accessToken, {
        name,
        slug,
        description: projectDescription.trim() || undefined,
      });

      setProjects((current) => [result.project, ...current]);
      handleSelectProject(result.project.id);
      setIsNewProjectOpen(false);
      resetProjectFields();
    } catch (error) {
      setProjectError(errorMessage(error, "Failed to create project"));
    } finally {
      setIsCreatingProject(false);
    }
  }

  async function handleCreatePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setPromptError("Create a project first.");
      return;
    }

    let name: string;

    try {
      name = validateName(promptName, "prompt name");
    } catch (error) {
      setPromptError(errorMessage(error, "Invalid prompt input"));
      return;
    }

    setIsCreatingPrompt(true);
    setPromptError(null);

    try {
      const result = await createPrompt(accessToken, selectedProjectId, {
        name,
        description: promptDescription.trim() || undefined,
      });

      setPrompts((current) => [result.prompt, ...current]);
      setSelectedPromptId(result.prompt.id);
      setPromptName("");
      setPromptDescription("");
      setIsPromptComposerOpen(false);
      setActiveTab("versions");
      setIsVersionComposerOpen(true);
      setVersionMessage({
        text: "Prompt created. Write the template and cut your first draft.",
        isError: false,
      });
    } catch (error) {
      setPromptError(errorMessage(error, "Failed to create prompt"));
    } finally {
      setIsCreatingPrompt(false);
    }
  }

  function handleComposerFieldChange(
    field: "template" | "model" | "modelParams" | "variableSchema",
    value: string,
  ) {
    if (field === "template") {
      setVersionTemplate(value);
    } else if (field === "model") {
      setVersionModel(value);
    } else if (field === "modelParams") {
      setVersionModelParams(value);
    } else {
      setVersionVariableSchema(value);
    }
  }

  function handleGenerateSchema() {
    const variables = Array.from(
      new Set(
        Array.from(versionTemplate.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g)).map(
          (match) => match[1],
        ),
      ),
    );

    setVersionVariableSchema(
      JSON.stringify(
        {
          type: "object",
          properties: Object.fromEntries(
            variables.map((variable) => [variable, { type: "string", minLength: 1 }]),
          ),
          required: variables,
          additionalProperties: false,
        },
        null,
        2,
      ),
    );
  }

  async function handleCreateVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !selectedPromptId) {
      return;
    }

    const template = versionTemplate.trim();
    const model = versionModel.trim();

    if (template.length < 3) {
      setVersionMessage({
        text: "template must be at least 3 characters",
        isError: true,
      });
      return;
    }

    let modelParams: Record<string, unknown> | undefined;
    let variableSchema: Record<string, unknown> | undefined;

    try {
      modelParams = parseJsonObject(versionModelParams, "model params");

      if (versionVariableSchema.trim()) {
        variableSchema = parseJsonObject(versionVariableSchema, "variable schema");
      }
    } catch (error) {
      setVersionMessage({
        text: errorMessage(error, "Invalid JSON"),
        isError: true,
      });
      return;
    }

    const idempotencyKey = await versionIdempotencyKey(selectedPromptId, {
      template,
      variableSchema,
      model: model || undefined,
      modelParams,
    });

    setIsCreatingVersion(true);

    try {
      const result = await createPromptVersion(
        accessToken,
        selectedProjectId,
        selectedPromptId,
        {
          template,
          variableSchema,
          model: model || undefined,
          modelParams,
        },
        idempotencyKey,
      );

      setPromptVersions((current) => [result.promptVersion, ...current]);
      setVersionTemplate("");
      setVersionModel("");
      setVersionVariableSchema("");
      setVersionModelParams(DEFAULT_MODEL_PARAMS);
      setIsVersionComposerOpen(false);
      setVersionMessage({
        text: `Version ${result.promptVersion.version} created.`,
        isError: false,
      });
    } catch (error) {
      setVersionMessage({
        text: errorMessage(error, "Failed to create version"),
        isError: true,
      });
    } finally {
      setIsCreatingVersion(false);
    }
  }

  async function handlePromote(version: PromptVersion) {
    if (!selectedProjectId || !selectedPromptId) {
      return;
    }

    if (version.status === "LIVE") {
      setVersionMessage({
        text: `Version ${version.version} is already live.`,
        isError: false,
      });
      return;
    }

    setPromotingVersion(version.version);
    setVersionMessage({
      text: liveVersion
        ? `Rolling back to version ${version.version}...`
        : `Promoting version ${version.version}...`,
      isError: false,
    });

    try {
      const action = liveVersion ? rollbackPromptVersion : promotePromptVersion;
      const result = await action(
        accessToken,
        selectedProjectId,
        selectedPromptId,
        version.version,
        liveVersion?.version ?? null,
      );

      setPromptVersions((current) =>
        current.map((currentVersion) => {
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
      setVersionMessage({
        text: `Version ${result.promptVersion.version} is now live.`,
        isError: false,
      });
    } catch (error) {
      setVersionMessage({
        text: errorMessage(error, "Failed to promote version"),
        isError: true,
      });
    } finally {
      setPromotingVersion(null);
    }
  }

  async function handleSetTag(version: PromptVersion, tag: string) {
    if (!selectedProjectId || !selectedPromptId) {
      return;
    }

    try {
      const result = await setVersionTag(
        accessToken,
        selectedProjectId,
        selectedPromptId,
        version.version,
        tag,
      );

      setPromptTags((current) => [
        ...current.filter(
          (item) => item.tag !== tag && item.versionId !== result.tag.versionId,
        ),
        result.tag,
      ]);
      setVersionMessage({
        text: `Tag "${tag}" set on v${version.version}.`,
        isError: false,
      });
    } catch (error) {
      setVersionMessage({
        text: errorMessage(error, "Failed to set tag"),
        isError: true,
      });

      try {
        const result = await listPromptTags(
          accessToken,
          selectedProjectId,
          selectedPromptId,
        );

        setPromptTags(result.tags);
      } catch {
        setPromptTags([]);
      }
    }
  }

  async function handleRemoveTag(tag: string) {
    if (!selectedProjectId || !selectedPromptId) {
      return;
    }

    try {
      await removeVersionTag(accessToken, selectedProjectId, selectedPromptId, tag);

      setPromptTags((current) => current.filter((item) => item.tag !== tag));
      setVersionMessage({
        text: `Tag "${tag}" removed.`,
        isError: false,
      });
    } catch (error) {
      setVersionMessage({
        text: errorMessage(error, "Failed to remove tag"),
        isError: true,
      });
    }
  }

  async function handleCreateApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setApiKeyError("Select a project first.");
      return;
    }

    let name: string;

    try {
      name = validateName(apiKeyName, "api key name");
    } catch (error) {
      setApiKeyError(errorMessage(error, "Invalid API key input"));
      return;
    }

    setIsCreatingApiKey(true);
    setApiKeyError(null);
    setNewRawApiKey(null);

    try {
      const result = await createApiKey(accessToken, selectedProjectId, { name });

      setApiKeys((current) => [result.apiKey, ...current]);
      setNewRawApiKey(result.key);
      setApiKeyName("");
      setIsKeyComposerOpen(false);
    } catch (error) {
      setApiKeyError(errorMessage(error, "Failed to create API key"));
    } finally {
      setIsCreatingApiKey(false);
    }
  }

  async function handleRevokeApiKey(apiKey: ApiKey) {
    if (!selectedProjectId || apiKey.revokedAt) {
      return;
    }

    setRevokingApiKeyId(apiKey.id);

    try {
      await revokeApiKey(accessToken, selectedProjectId, apiKey.id);

      setApiKeys((current) =>
        current.map((currentKey) =>
          currentKey.id === apiKey.id
            ? { ...currentKey, revokedAt: new Date().toISOString() }
            : currentKey,
        ),
      );
    } catch (error) {
      setApiKeyError(errorMessage(error, "Failed to revoke API key"));
    } finally {
      setRevokingApiKeyId(null);
    }
  }

  async function handleRender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !selectedPromptId || !liveVersion || !user) {
      return;
    }

    setIsRendering(true);
    setRuntimeMessage({ text: "Rendering live prompt...", isError: false });

    try {
      const variables = parseTemplateVariables(runtimeVariables);
      const result = await renderLivePrompt(accessToken, selectedProjectId, selectedPromptId, {
        variables,
      });

      setRenderResult(result);
      setExecutions((current) => [
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
        ...current.filter((execution) => execution.id !== result.executionId),
      ]);
      setSelectedExecutionId(result.executionId);
      setRuntimeMessage({
        text: `Rendered live version v${result.promptVersion.version}.`,
        isError: false,
      });
    } catch (error) {
      setRenderResult(null);
      setRuntimeMessage({
        text: errorMessage(error, "Failed to render live prompt"),
        isError: true,
      });
    } finally {
      setIsRendering(false);
    }
  }

  const showEmptyProjectState = !isLoadingProjects && projects.length === 0;

  const newProjectFields = (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="console-project-name">Project name</Label>
        <Input
          disabled={isCreatingProject}
          id="console-project-name"
          minLength={2}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="Customer Support AI"
          required
          value={projectName}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="console-project-slug">Slug optional</Label>
        <Input
          disabled={isCreatingProject}
          id="console-project-slug"
          onChange={(event) => setProjectSlug(event.target.value)}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="customer-support-ai"
          title="Use lowercase letters, numbers, and hyphens"
          value={projectSlug}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="console-project-description">Description optional</Label>
        <Textarea
          disabled={isCreatingProject}
          id="console-project-description"
          maxLength={500}
          onChange={(event) => setProjectDescription(event.target.value)}
          rows={3}
          value={projectDescription}
        />
      </div>
      {projectError ? (
        <p className="font-mono text-xs text-destructive">{projectError}</p>
      ) : null}
    </>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-[52px] flex-none items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[17px] font-bold tracking-tight">pr</span>
          {!showEmptyProjectState && projects.length > 0 ? (
            <div className="pv2-switcher-wrap relative">
              <button
                aria-expanded={projectMenuOpen}
                aria-haspopup="listbox"
                className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium hover:bg-accent"
                onClick={() => setProjectMenuOpen((open) => !open)}
                type="button"
              >
                {selectedProject?.name ?? "no workspace"}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              {projectMenuOpen ? (
                <ul
                  className="absolute left-0 top-full z-40 mt-1.5 min-w-48 rounded-xl border bg-popover p-1 shadow-lg"
                  role="listbox"
                >
                  {projects.map((project) => (
                    <li key={project.id}>
                      <button
                        aria-selected={project.id === selectedProjectId}
                        className={cn(
                          "block w-full rounded-lg px-2.5 py-2 text-left font-mono text-[13px]",
                          project.id === selectedProjectId
                            ? "bg-accent font-semibold"
                            : "hover:bg-accent",
                        )}
                        onClick={() => handleSelectProject(project.id)}
                        role="option"
                        type="button"
                      >
                        {project.name}
                      </button>
                    </li>
                  ))}
                  <li className="my-1 border-t">
                    <button
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[13px] hover:bg-accent"
                      onClick={() => {
                        setProjectMenuOpen(false);
                        resetProjectFields();
                        setIsNewProjectOpen(true);
                      }}
                      type="button"
                    >
                      <Plus className="size-3.5" /> New project
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <span className="grid size-8 place-items-center rounded-full bg-primary font-mono text-[11px] font-bold text-primary-foreground">
            {initials(user)}
          </span>
          <Button onClick={onLogout} size="sm" variant="outline" type="button">
            Log out
          </Button>
        </div>
      </header>

      {showEmptyProjectState ? (
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto mt-14 grid w-full max-w-md justify-items-center gap-3.5 text-center">
            <h2 className="m-0 text-2xl font-semibold tracking-tight">
              Create your first workspace
            </h2>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              Projects own prompts, versions, API keys, and execution history. Everything starts
              here.
            </p>
            <form className="mt-2 grid w-full gap-3 rounded-xl border bg-card p-4 text-left" onSubmit={handleCreateProject}>
              {newProjectFields}
              <DialogFooter className="gap-2">
                <Button disabled={isCreatingProject} type="submit">
                  {isCreatingProject ? "Creating..." : "Create project"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </main>
      ) : (
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="hidden space-y-6 overflow-y-auto border-r p-3 md:block">
            <section>
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Prompts
                </p>
                <button
                  aria-label="New prompt"
                  className="grid size-5 place-items-center rounded-md border text-muted-foreground hover:text-foreground"
                  onClick={() => setIsPromptComposerOpen((open) => !open)}
                  title="New prompt"
                  type="button"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              {isPromptComposerOpen ? (
                <form className="mb-2 grid gap-2.5 rounded-xl border bg-card p-3" onSubmit={handleCreatePrompt}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="console-prompt-name">Name</Label>
                    <Input
                      disabled={isCreatingPrompt}
                      id="console-prompt-name"
                      minLength={2}
                      onChange={(event) => setPromptName(event.target.value)}
                      placeholder="reply-generator"
                      required
                      value={promptName}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="console-prompt-description">Description optional</Label>
                    <Textarea
                      disabled={isCreatingPrompt}
                      id="console-prompt-description"
                      maxLength={500}
                      onChange={(event) => setPromptDescription(event.target.value)}
                      rows={3}
                      value={promptDescription}
                    />
                  </div>
                  {promptError ? (
                    <p className="font-mono text-xs text-destructive">{promptError}</p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setIsPromptComposerOpen(false);
                        setPromptError(null);
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isCreatingPrompt} size="sm" type="submit">
                      {isCreatingPrompt ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              ) : null}
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {prompts.map((item) => (
                  <li key={item.id}>
                    <button
                      className={cn(
                        "grid w-full gap-0.5 rounded-lg px-2.5 py-2 text-left",
                        item.id === selectedPromptId
                          ? "bg-card shadow-[inset_0_0_0_1px_var(--border)]"
                          : "hover:bg-accent",
                      )}
                      onClick={() => handleSelectPrompt(item.id)}
                      type="button"
                    >
                      <span className="truncate font-mono text-[13px]">{item.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        updated {timeAgo(item.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
                {isLoadingPrompts ? (
                  <li className="px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
                    Loading prompts...
                  </li>
                ) : null}
              </ul>
            </section>

            <section>
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  API keys
                </p>
                <button
                  aria-label="New API key"
                  className="grid size-5 place-items-center rounded-md border text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsKeyComposerOpen((open) => !open);
                    setNewRawApiKey(null);
                  }}
                  title="New API key"
                  type="button"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              {isKeyComposerOpen ? (
                <form className="mb-2 grid gap-2.5 rounded-xl border bg-card p-3" onSubmit={handleCreateApiKey}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="console-key-name">Key name</Label>
                    <Input
                      disabled={isCreatingApiKey}
                      id="console-key-name"
                      minLength={2}
                      onChange={(event) => setApiKeyName(event.target.value)}
                      placeholder="support-service-prod"
                      required
                      value={apiKeyName}
                    />
                  </div>
                  {apiKeyError ? (
                    <p className="font-mono text-xs text-destructive">{apiKeyError}</p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setIsKeyComposerOpen(false);
                        setApiKeyError(null);
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isCreatingApiKey} size="sm" type="submit">
                      {isCreatingApiKey ? "Creating..." : "Create key"}
                    </Button>
                  </div>
                </form>
              ) : null}
              {newRawApiKey ? (
                <div className="mb-2 grid gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                  <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Copy now · shown once
                  </p>
                  <code className="overflow-x-auto whitespace-nowrap rounded-lg bg-foreground p-2.5 font-mono text-xs text-background">
                    {newRawApiKey}
                  </code>
                </div>
              ) : null}
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {apiKeys.map((key) => (
                  <li key={key.id}>
                    <div
                      className={cn(
                        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-2.5 py-2",
                        key.revokedAt && "opacity-55",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          key.revokedAt ? "bg-muted-foreground/50" : "bg-emerald-500",
                        )}
                      />
                      <div className="grid min-w-0 gap-0.5">
                        <span className="truncate text-[13px]">{key.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {key.revokedAt
                            ? "revoked"
                            : key.lastUsedAt
                              ? `${key.prefix}… · used ${timeAgo(key.lastUsedAt)}`
                              : `${key.prefix}… · never used`}
                        </span>
                      </div>
                      {key.revokedAt ? null : (
                        <button
                          aria-label={`Revoke ${key.name}`}
                          className="grid size-[22px] place-items-center rounded-md text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                          disabled={revokingApiKeyId === key.id}
                          onClick={() => void handleRevokeApiKey(key)}
                          title="Revoke key"
                          type="button"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {isLoadingApiKeys ? (
                  <li className="px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
                    Loading keys...
                  </li>
                ) : null}
              </ul>
            </section>

            <section className="px-2 pb-2 pt-1">
              <Badge variant="outline">
                {activeKeyCount} keys active
              </Badge>
            </section>
          </aside>

          <main className="min-w-0 overflow-y-auto p-6 lg:p-8">
            {projects.length > 0 && prompts.length === 0 ? (
              <div className="mx-auto mt-14 grid w-full max-w-md justify-items-center gap-3.5 text-center">
                <h2 className="m-0 text-2xl font-semibold tracking-tight">No prompts yet</h2>
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                  Create the first prompt in {selectedProject?.name}, then cut an immutable draft
                  and promote it live.
                </p>
                <form className="mt-2 grid w-full gap-3 rounded-xl border bg-card p-4 text-left" onSubmit={handleCreatePrompt}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="empty-prompt-name">Name</Label>
                    <Input
                      disabled={isCreatingPrompt}
                      id="empty-prompt-name"
                      minLength={2}
                      onChange={(event) => setPromptName(event.target.value)}
                      placeholder="reply-generator"
                      required
                      value={promptName}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="empty-prompt-description">Description optional</Label>
                    <Textarea
                      disabled={isCreatingPrompt}
                      id="empty-prompt-description"
                      maxLength={500}
                      onChange={(event) => setPromptDescription(event.target.value)}
                      rows={3}
                      value={promptDescription}
                    />
                  </div>
                  {promptError ? (
                    <p className="font-mono text-xs text-destructive">{promptError}</p>
                  ) : null}
                  <DialogFooter className="gap-2">
                    <Button disabled={isCreatingPrompt} type="submit">
                      {isCreatingPrompt ? "Creating..." : "Create prompt"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            ) : selectedPrompt ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0">
                    <h1 className="m-0 truncate font-mono text-2xl font-semibold tracking-tight">
                      {selectedPrompt.name}
                    </h1>
                    <p className="m-0 mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {selectedPrompt.description ?? "No description yet."}
                    </p>
                    <p className="m-0 mt-2 font-mono text-xs text-muted-foreground">
                      {selectedProject?.slug}/{selectedPrompt.slug} · updated{" "}
                      {timeAgo(selectedPrompt.updatedAt)}
                    </p>
                  </div>
                  <div className="grid justify-items-start gap-2 sm:justify-items-end">
                    {liveVersion ? (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                        live v{liveVersion.version}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="px-3 py-1">
                        not live
                      </Badge>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {liveVersion?.model ?? promptVersions[0]?.model ?? "no model"}
                    </span>
                  </div>
                </div>

                {heroTemplate ? <TemplateBlock className="mt-5" template={heroTemplate} /> : null}

                <Tabs
                  className="mt-6 gap-0"
                  onValueChange={(value) => setActiveTab(value as TabId)}
                  value={activeTab}
                >
                  <TabsList className="justify-start rounded-none border-b bg-transparent p-0">
                    {TABS.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        {tab.label}
                        {tab.id === "history" && executions.length > 0 ? (
                          <span className="rounded-full bg-secondary px-1.5 font-mono text-[11px] text-muted-foreground">
                            {executions.length}
                          </span>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {activeTab === "versions" ? (
                  <VersionLedger
                    composer={composerState}
                    isCreatingVersion={isCreatingVersion}
                    isLoading={isLoadingVersions}
                    liveVersion={liveVersion}
                    message={versionMessage}
                    promotingVersion={promotingVersion}
                    tags={promptTags}
                    onCreateVersion={handleCreateVersion}
                    onComposerFieldChange={handleComposerFieldChange}
                    onGenerateSchema={handleGenerateSchema}
                    onPromote={(version) => void handlePromote(version)}
                    onRemoveTag={(tag) => void handleRemoveTag(tag)}
                    onSetTag={(version, tag) => void handleSetTag(version, tag)}
                    onToggleComposer={() => setIsVersionComposerOpen((open) => !open)}
                    versions={promptVersions}
                  />
                ) : null}

                {activeTab === "runtime" ? (
                  <RuntimePanel
                    canRender={Boolean(selectedProjectId && selectedPromptId && liveVersion)}
                    isRendering={isRendering}
                    message={runtimeMessage}
                    onVariablesChange={setRuntimeVariables}
                    onSubmit={(event) => void handleRender(event)}
                    result={renderResult}
                    variablesJson={runtimeVariables}
                  />
                ) : null}

                {activeTab === "history" ? (
                  <ExecutionHistory
                    detail={executionDetail}
                    isLoading={isLoadingExecutions}
                    isLoadingDetail={isLoadingExecutionDetail}
                    executions={executions}
                    onCloseDetail={() => {
                      setSelectedExecutionId(null);
                      setExecutionDetail(null);
                    }}
                    onSelect={(executionId) => setSelectedExecutionId(executionId)}
                    selectedExecutionId={selectedExecutionId}
                  />
                ) : null}
              </>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                {isLoadingPrompts ? "Loading prompts..." : "Select a prompt."}
              </p>
            )}
          </main>
        </div>
      )}

      <footer className="flex h-8 flex-none items-center gap-6 border-t bg-card px-4 font-mono text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "size-1.5 rounded-full",
              liveVersion ? "bg-emerald-500" : "bg-muted-foreground/50",
            )}
          />
          api {apiOrigin.replace(/^https?:\/\//, "")}
        </span>
        <span>{selectedProject?.name ?? "no workspace"}</span>
        <span>{activeKeyCount} keys active</span>
        <span className="ml-auto">signed in as {user.name ?? user.email}</span>
      </footer>

      <Dialog
        onOpenChange={(open) => {
          setIsNewProjectOpen(open);

          if (!open) {
            resetProjectFields();
          }
        }}
        open={isNewProjectOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              This becomes the parent workspace for prompts and API keys.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={handleCreateProject}>
            {newProjectFields}
            <DialogFooter className="gap-2">
              <Button disabled={isCreatingProject} type="submit">
                {isCreatingProject ? "Creating..." : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
