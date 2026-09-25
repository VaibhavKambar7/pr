import { getProjectForUser } from "../projects/project.service.js";
import { createTool, findToolBySlug, listToolsByProject } from "./tool.repository.js";
import type { CreateToolInput } from "./tool.schema.js";

export class ToolConflictError extends Error {
  constructor() {
    super("tool slug already exists");
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

  return createTool({ ...input, projectId, slug });
}

export async function listToolsForProject(ownerId: string, projectId: string) {
  await getProjectForUser(ownerId, projectId);
  return listToolsByProject(projectId);
}
