import { prisma } from "@pr/database";
import type { CreatePromptInput, UpdatePromptInput } from "./prompt.schema.js";

type CreatePromptRecordInput = CreatePromptInput & {
  projectId: string;
  slug: string;
};

type PromptIdentity = {
  id: string;
  projectId: string;
};

export async function createPrompt(input: CreatePromptRecordInput) {
  return prisma.prompt.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      projectId: input.projectId,
    },
  });
}

export async function findPromptBySlug(projectId: string, slug: string) {
  return prisma.prompt.findUnique({
    where: {
      projectId_slug: {
        projectId,
        slug,
      },
    },
  });
}

export async function listPromptsByProject(projectId: string) {
  return prisma.prompt.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findPromptById(input: PromptIdentity) {
  return prisma.prompt.findFirst({
    where: {
      id: input.id,
      projectId: input.projectId,
    },
  });
}

export async function updatePrompt(input: PromptIdentity & UpdatePromptInput) {
  return prisma.prompt.updateMany({
    where: {
      id: input.id,
      projectId: input.projectId,
    },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
    },
  });
}

export async function deletePrompt(input: PromptIdentity) {
  return prisma.prompt.deleteMany({
    where: {
      id: input.id,
      projectId: input.projectId,
    },
  });
}
