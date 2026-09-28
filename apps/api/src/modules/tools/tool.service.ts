import { getProjectForUser } from "../projects/project.service.js";
import {
  createTool,
  deleteTool,
  findToolById,
  findToolBySlug,
  listToolsByProject,
  updateTool,
} from "./tool.repository.js";
import type { CreateToolInput, UpdateToolInput } from "./tool.schema.js";

export class ToolConflictError extends Error {
  constructor() {
    super("tool slug already exists");
  }
}

export class ToolNotFoundError extends Error {
  constructor() {
    super("tool not found");
  }
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createToolForProject(
  ownerId: string,
  projectId: string,
  input: CreateToolInput,
) {
  await getProjectForUser(ownerId, projectId);

  const slug = toSlug(input.slug ?? input.name);

  if (!slug) {
    throw new Error("tool slug is required");
  }

  if (await findToolBySlug(projectId, slug)) {
    throw new ToolConflictError();
  }

  return createTool({ ...input, projectId, ownerId, slug });
}

export async function listToolsForProject(ownerId: string, projectId: string) {
  await getProjectForUser(ownerId, projectId);
  return listToolsByProject(projectId);
}

export async function getToolForProject(ownerId: string, projectId: string, toolId: string) {
  await getProjectForUser(ownerId, projectId);

  const tool = await findToolById(projectId, toolId);

  if (!tool) {
    throw new ToolNotFoundError();
  }

  return tool;
}

export async function updateToolForProject(
  ownerId: string,
  projectId: string,
  toolId: string,
  input: UpdateToolInput,
) {
  await getProjectForUser(ownerId, projectId);

  const existingTool = await findToolById(projectId, toolId);

  if (!existingTool) {
    throw new ToolNotFoundError();
  }

  const slug = input.slug ? toSlug(input.slug) : undefined;

  if (slug && slug !== existingTool.slug) {
    const toolWithSlug = await findToolBySlug(projectId, slug);

    if (toolWithSlug) {
      throw new ToolConflictError();
    }
  }

  const result = await updateTool(projectId, toolId, ownerId, { ...input, slug });

  if (result.count === 0) {
    throw new ToolNotFoundError();
  }

  const updatedTool = await findToolById(projectId, toolId);

  if (!updatedTool) {
    throw new ToolNotFoundError();
  }

  return updatedTool;
}

export async function deleteToolForProject(
  ownerId: string,
  projectId: string,
  toolId: string,
) {
  await getProjectForUser(ownerId, projectId);

  const result = await deleteTool(projectId, toolId, ownerId);

  if (result.count === 0) {
    throw new ToolNotFoundError();
  }
}
