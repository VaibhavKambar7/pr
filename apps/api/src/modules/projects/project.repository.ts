import { prisma } from "@pr/database";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema.js";

type CreateProjectRecordInput = CreateProjectInput & {
  ownerId: string;
  slug: string;
};

type ProjectIdentity = {
  id: string;
  ownerId: string;
};

export async function createProject(input: CreateProjectRecordInput) {
  return prisma.project.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      ownerId: input.ownerId,
    },
  });
}

export async function findProjectBySlug(ownerId: string, slug: string) {
  return prisma.project.findUnique({
    where: {
      ownerId_slug: {
        ownerId,
        slug,
      },
    },
  });
}

export async function listProjectsByOwner(ownerId: string) {
  return prisma.project.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findProjectById(input: ProjectIdentity) {
  return prisma.project.findFirst({
    where: {
      id: input.id,
      ownerId: input.ownerId,
    },
  });
}

export async function updateProject(input: ProjectIdentity & UpdateProjectInput) {
  return prisma.project.updateMany({
    where: {
      id: input.id,
      ownerId: input.ownerId,
    },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
    },
  });
}

export async function deleteProject(input: ProjectIdentity) {
  return prisma.project.deleteMany({
    where: {
      id: input.id,
      ownerId: input.ownerId,
    },
  });
}
