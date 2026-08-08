import { ProjectNotFoundError, getProjectForUser } from "../projects/project.service.js";
import {
  createPrompt,
  deletePrompt,
  findPromptById,
  findPromptBySlug,
  listPromptsByProject,
  updatePrompt,
} from "./prompt.repository.js";
import type { CreatePromptInput, UpdatePromptInput } from "./prompt.schema.js";

export class PromptConflictError extends Error {
  constructor() {
    super("prompt slug already exists");
  }
}

export class PromptNotFoundError extends Error {
  constructor() {
    super("prompt not found");
  }
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureProjectAccess(ownerId: string, projectId: string) {
  try {
    return await getProjectForUser(ownerId, projectId);
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      throw new ProjectNotFoundError();
    }

    throw error;
  }
}

export async function createPromptForProject(ownerId: string, projectId: string, input: CreatePromptInput) {
  await ensureProjectAccess(ownerId, projectId);

  const slug = toSlug(input.slug ?? input.name);

  if (!slug) {
    throw new Error("prompt slug is required");
  }

  const existingPrompt = await findPromptBySlug(projectId, slug);

  if (existingPrompt) {
    throw new PromptConflictError();
  }

  return createPrompt({
    projectId,
    name: input.name,
    slug,
    description: input.description,
  });
}

export async function listPromptsForProject(ownerId: string, projectId: string) {
  await ensureProjectAccess(ownerId, projectId);

  return listPromptsByProject(projectId);
}

export async function getPromptForProject(ownerId: string, projectId: string, promptId: string) {
  await ensureProjectAccess(ownerId, projectId);

  const prompt = await findPromptById({
    id: promptId,
    projectId,
  });

  if (!prompt) {
    throw new PromptNotFoundError();
  }

  return prompt;
}

export async function updatePromptForProject(
  ownerId: string,
  projectId: string,
  promptId: string,
  input: UpdatePromptInput,
) {
  const existingPrompt = await getPromptForProject(ownerId, projectId, promptId);
  const slug = input.slug ? toSlug(input.slug) : undefined;

  if (slug && slug !== existingPrompt.slug) {
    const promptWithSlug = await findPromptBySlug(projectId, slug);

    if (promptWithSlug) {
      throw new PromptConflictError();
    }
  }

  const result = await updatePrompt({
    id: promptId,
    projectId,
    name: input.name,
    slug,
    description: input.description,
  });

  if (result.count === 0) {
    throw new PromptNotFoundError();
  }

  return getPromptForProject(ownerId, projectId, promptId);
}

export async function deletePromptForProject(ownerId: string, projectId: string, promptId: string) {
  await ensureProjectAccess(ownerId, projectId);

  const result = await deletePrompt({
    id: promptId,
    projectId,
  });

  if (result.count === 0) {
    throw new PromptNotFoundError();
  }
}
