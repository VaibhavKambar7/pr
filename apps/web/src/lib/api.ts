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

type CreateProjectInput = {
  name: string;
  slug?: string;
  description?: string;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(body.error ?? "request failed");
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
