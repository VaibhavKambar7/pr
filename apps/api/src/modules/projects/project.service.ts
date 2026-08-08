import {
  createProject,
  deleteProject,
  findProjectById,
  findProjectBySlug,
  listProjectsByOwner,
  updateProject,
} from "./project.repository.js";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema.js";

export class ProjectConflictError extends Error {
  constructor() {
    super("project slug already exists");
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super("project not found");
  }
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createProjectForUser(ownerId: string, input: CreateProjectInput) {
  const slug = toSlug(input.slug ?? input.name);

  if (!slug) {
    throw new Error("project slug is required");
  }

  const existingProject = await findProjectBySlug(ownerId, slug);

  if (existingProject) {
    throw new ProjectConflictError();
  }

  return createProject({
    ownerId,
    name: input.name,
    slug,
    description: input.description,
  });
}

export async function listProjectsForUser(ownerId: string) {
  return listProjectsByOwner(ownerId);
}

export async function getProjectForUser(ownerId: string, projectId: string) {
  const project = await findProjectById({ id: projectId, ownerId });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  return project;
}

export async function updateProjectForUser(ownerId: string, projectId: string, input: UpdateProjectInput) {
  const existingProject = await getProjectForUser(ownerId, projectId);
  const slug = input.slug ? toSlug(input.slug) : undefined;

  if (slug && slug !== existingProject.slug) {
    const projectWithSlug = await findProjectBySlug(ownerId, slug);

    if (projectWithSlug) {
      throw new ProjectConflictError();
    }
  }

  const result = await updateProject({
    id: projectId,
    ownerId,
    name: input.name,
    slug,
    description: input.description,
  });

  if (result.count === 0) {
    throw new ProjectNotFoundError();
  }

  return getProjectForUser(ownerId, projectId);
}

export async function deleteProjectForUser(ownerId: string, projectId: string) {
  const result = await deleteProject({ id: projectId, ownerId });

  if (result.count === 0) {
    throw new ProjectNotFoundError();
  }
}
