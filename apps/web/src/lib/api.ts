const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiErrorResponse = {
  error?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type CreateProjectInput = {
  name: string;
  slug?: string;
  description?: string;
};

type CreateApiKeyInput = {
  name: string;
};

export type Prompt = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreatePromptInput = {
  name: string;
  slug?: string;
  description?: string;
};

export type PromptVersionStatus = "DRAFT" | "LIVE" | "ARCHIVED";

export type PromptVersion = {
  id: string;
  promptId: string;
  version: number;
  status: PromptVersionStatus;
  template: string;
  model: string | null;
  modelParams: unknown;
  createdAt: string;
  promotedAt: string | null;
  archivedAt: string | null;
};

type CreatePromptVersionInput = {
  template: string;
  model?: string;
  modelParams?: Record<string, unknown>;
};

type RenderLivePromptInput = {
  variables: Record<string, string | number | boolean | null>;
};

export type RuntimeRenderResult = {
  executionId: string;
  prompt: Prompt;
  promptVersion: {
    id: string;
    version: number;
    status: PromptVersionStatus;
    model: string | null;
    modelParams: unknown;
    createdAt: string;
    promotedAt: string | null;
  };
  renderedPrompt: string;
};

type ExecutionPromptSummary = {
  id: string;
  name: string;
  slug: string;
};

type ExecutionPromptVersionSummary = {
  id: string;
  version: number;
  status: PromptVersionStatus;
  model: string | null;
};

type ExecutionApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
};

type ExecutionUserSummary = {
  id: string;
  email: string;
  name: string | null;
};

export type ExecutionListItem = {
  id: string;
  latencyMs: number | null;
  output: string | null;
  error: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costUsd: string | null;
  createdAt: string;
  prompt: ExecutionPromptSummary;
  promptVersion: ExecutionPromptVersionSummary;
  apiKey: ExecutionApiKeySummary | null;
  user: ExecutionUserSummary | null;
};

export type ExecutionDetail = ExecutionListItem & {
  projectId: string;
  promptId: string;
  promptVersionId: string;
  apiKeyId: string | null;
  userId: string | null;
  variables: unknown;
  renderedPrompt: string;
  promptVersion: ExecutionPromptVersionSummary & {
    modelParams: unknown;
    createdAt: string;
    promotedAt: string | null;
  };
};

async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(body.error ?? "request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function register(input: RegisterInput) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe(accessToken: string) {
  return request<{ user: AuthUser }>("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function listProjects(accessToken: string) {
  return request<{ projects: Project[] }>("/projects", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createProject(accessToken: string, input: CreateProjectInput) {
  return request<{ project: Project }>("/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function listApiKeys(accessToken: string, projectId: string) {
  return request<{ apiKeys: ApiKey[] }>(`/projects/${projectId}/api-keys`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createApiKey(accessToken: string, projectId: string, input: CreateApiKeyInput) {
  return request<{ apiKey: ApiKey; key: string }>(`/projects/${projectId}/api-keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function revokeApiKey(accessToken: string, projectId: string, apiKeyId: string) {
  return request<void>(`/projects/${projectId}/api-keys/${apiKeyId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function listPrompts(accessToken: string, projectId: string) {
  return request<{ prompts: Prompt[] }>(`/projects/${projectId}/prompts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createPrompt(accessToken: string, projectId: string, input: CreatePromptInput) {
  return request<{ prompt: Prompt }>(`/projects/${projectId}/prompts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function listPromptVersions(accessToken: string, projectId: string, promptId: string) {
  return request<{ promptVersions: PromptVersion[] }>(
    `/projects/${projectId}/prompts/${promptId}/versions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function createPromptVersion(
  accessToken: string,
  projectId: string,
  promptId: string,
  input: CreatePromptVersionInput,
) {
  return request<{ promptVersion: PromptVersion }>(`/projects/${projectId}/prompts/${promptId}/versions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function promotePromptVersion(
  accessToken: string,
  projectId: string,
  promptId: string,
  version: number,
) {
  return request<{ promptVersion: PromptVersion }>(
    `/projects/${projectId}/prompts/${promptId}/versions/${version}/promote`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function rollbackPromptVersion(
  accessToken: string,
  projectId: string,
  promptId: string,
  version: number,
) {
  return request<{ promptVersion: PromptVersion }>(
    `/projects/${projectId}/prompts/${promptId}/versions/${version}/rollback`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function renderLivePrompt(
  accessToken: string,
  projectId: string,
  promptId: string,
  input: RenderLivePromptInput,
) {
  return request<RuntimeRenderResult>(`/runtime/projects/${projectId}/prompts/${promptId}/render`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function listExecutions(accessToken: string, projectId: string, promptId?: string) {
  const query = promptId ? `?promptId=${encodeURIComponent(promptId)}` : "";

  return request<{ executions: ExecutionListItem[] }>(`/projects/${projectId}/executions${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getExecution(accessToken: string, projectId: string, executionId: string) {
  return request<{ execution: ExecutionDetail }>(`/projects/${projectId}/executions/${executionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
