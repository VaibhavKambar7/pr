import { clearAuthSession, getStoredAccessToken, getStoredRefreshToken, storeAuthTokens } from "./auth-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiErrorResponse = {
  error?: string | { code: string; message: string; issues?: Array<{ path: string; message: string }> };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type RefreshSessionResponse = AuthResponse;

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RefreshSessionInput = {
  refreshToken: string;
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

export type PromptVersionTag = {
  id: string;
  promptId: string;
  versionId: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
  version: {
    id: string;
    version: number;
    status: PromptVersionStatus;
  };
};

export type PromptVersion = {
  id: string;
  promptId: string;
  version: number;
  status: PromptVersionStatus;
  template: string;
  variableSchema: Record<string, unknown> | null;
  model: string | null;
  modelParams: unknown;
  changeNotes: string | null;
  createdAt: string;
  promotedAt: string | null;
  archivedAt: string | null;
};

type CreatePromptVersionInput = {
  template: string;
  variableSchema?: Record<string, unknown>;
  model?: string;
  modelParams?: Record<string, unknown>;
  changeNotes?: string;
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
    variableSchema: Record<string, unknown> | null;
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

export function formatApiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "request failed";
  }

  const message = error.message;

  try {
    const parsed = JSON.parse(message) as ApiErrorResponse;

    if (typeof parsed.error === "object" && parsed.error !== null) {
      const { code, issues } = parsed.error;

      if (issues !== undefined && issues.length > 0) {
        const issueMessages = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
        return `${code}: ${issueMessages}`;
      }

      return code;
    }
  } catch {
    // not JSON, use raw message
  }

  return message;
}

function getApiErrorMessage(body: ApiErrorResponse): string {
  if (typeof body.error === "string") {
    return body.error;
  }

  if (typeof body.error === "object" && body.error !== null) {
    const { code, message, issues } = body.error;

    if (issues !== undefined && issues.length > 0) {
      const issueMessages = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
      return `${message || code}: ${issueMessages}`;
    }

    return message || code;
  }

  return "request failed";
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

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
    throw new ApiRequestError(getApiErrorMessage(body), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

let refreshPromise: Promise<RefreshSessionResponse> | null = null;

function refreshStoredSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    return Promise.reject(new Error("refresh token is unavailable"));
  }

  const currentRefresh = refreshSession(refreshToken)
    .then((session) => {
      storeAuthTokens(session);
      return session;
    })
    .catch((error) => {
      clearAuthSession();
      throw error;
    })
    .finally(() => {
      if (refreshPromise === currentRefresh) {
        refreshPromise = null;
      }
    });

  refreshPromise = currentRefresh;

  return currentRefresh;
}

async function requestWithAuth<T>(accessToken: string, path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${getStoredAccessToken() ?? accessToken}`);

  try {
    return await request<T>(path, {
      ...init,
      headers,
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) {
      throw error;
    }

    const refreshedSession = await refreshStoredSession();

    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedSession.accessToken}`);

    return request<T>(path, {
      ...init,
      headers: retryHeaders,
    });
  }
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

export function refreshSession(refreshToken: string) {
  return request<RefreshSessionResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken } satisfies RefreshSessionInput),
  });
}

export function logoutSession(refreshToken: string) {
  return request<{ success: true }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken } satisfies RefreshSessionInput),
  });
}

export function getMe(accessToken: string) {
  return requestWithAuth<{ user: AuthUser }>(accessToken, "/auth/me");
}

export function listProjects(accessToken: string) {
  return requestWithAuth<{ projects: Project[] }>(accessToken, "/projects");
}

export function createProject(accessToken: string, input: CreateProjectInput) {
  return requestWithAuth<{ project: Project }>(accessToken, "/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listApiKeys(accessToken: string, projectId: string) {
  return requestWithAuth<{ apiKeys: ApiKey[] }>(accessToken, `/projects/${projectId}/api-keys`);
}

export function createApiKey(accessToken: string, projectId: string, input: CreateApiKeyInput) {
  return requestWithAuth<{ apiKey: ApiKey; key: string }>(accessToken, `/projects/${projectId}/api-keys`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function revokeApiKey(accessToken: string, projectId: string, apiKeyId: string) {
  return requestWithAuth<void>(accessToken, `/projects/${projectId}/api-keys/${apiKeyId}`, {
    method: "DELETE",
  });
}

export function listPrompts(accessToken: string, projectId: string) {
  return requestWithAuth<{ prompts: Prompt[] }>(accessToken, `/projects/${projectId}/prompts`);
}

export function createPrompt(accessToken: string, projectId: string, input: CreatePromptInput) {
  return requestWithAuth<{ prompt: Prompt }>(accessToken, `/projects/${projectId}/prompts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listPromptVersions(accessToken: string, projectId: string, promptId: string) {
  return requestWithAuth<{ promptVersions: PromptVersion[] }>(
    accessToken,
    `/projects/${projectId}/prompts/${promptId}/versions`,
  );
}

export function createPromptVersion(
  accessToken: string,
  projectId: string,
  promptId: string,
  input: CreatePromptVersionInput,
  idempotencyKey: string,
) {
  return requestWithAuth<{ promptVersion: PromptVersion }>(accessToken, `/projects/${projectId}/prompts/${promptId}/versions`, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(input),
  });
}

export function promotePromptVersion(
  accessToken: string,
  projectId: string,
  promptId: string,
  version: number,
  expectedLiveVersion: number | null,
) {
  return requestWithAuth<{ promptVersion: PromptVersion }>(
    accessToken,
    `/projects/${projectId}/prompts/${promptId}/versions/${version}/promote`,
    {
      method: "POST",
      body: JSON.stringify({ expectedLiveVersion }),
    },
  );
}

export function rollbackPromptVersion(
  accessToken: string,
  projectId: string,
  promptId: string,
  version: number,
  expectedLiveVersion: number | null,
) {
  return requestWithAuth<{ promptVersion: PromptVersion }>(
    accessToken,
    `/projects/${projectId}/prompts/${promptId}/versions/${version}/rollback`,
    {
      method: "POST",
      body: JSON.stringify({ expectedLiveVersion }),
    },
  );
}

export function renderLivePrompt(
  accessToken: string,
  projectId: string,
  promptId: string,
  input: RenderLivePromptInput,
) {
  return requestWithAuth<RuntimeRenderResult>(accessToken, `/runtime/projects/${projectId}/prompts/${promptId}/render`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listExecutions(accessToken: string, projectId: string, promptId?: string) {
  const query = promptId ? `?promptId=${encodeURIComponent(promptId)}` : "";

  return requestWithAuth<{ executions: ExecutionListItem[] }>(accessToken, `/projects/${projectId}/executions${query}`);
}

export function getExecution(accessToken: string, projectId: string, executionId: string) {
  return requestWithAuth<{ execution: ExecutionDetail }>(accessToken, `/projects/${projectId}/executions/${executionId}`);
}

export function setVersionTag(
  accessToken: string,
  projectId: string,
  promptId: string,
  version: number,
  tag: string,
) {
  return requestWithAuth<{ tag: PromptVersionTag }>(
    accessToken,
    `/projects/${projectId}/prompts/${promptId}/versions/${version}/tag`,
    {
      method: "PUT",
      body: JSON.stringify({ tag }),
    },
  );
}

export function removeVersionTag(
  accessToken: string,
  projectId: string,
  promptId: string,
  tag: string,
) {
  return requestWithAuth<void>(accessToken, `/projects/${projectId}/prompts/${promptId}/tags/${tag}`, {
    method: "DELETE",
  });
}

export function listPromptTags(accessToken: string, projectId: string, promptId: string) {
  return requestWithAuth<{ tags: PromptVersionTag[] }>(
    accessToken,
    `/projects/${projectId}/prompts/${promptId}/tags`,
  );
}
