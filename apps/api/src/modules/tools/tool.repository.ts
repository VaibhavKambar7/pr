import { prisma, type Prisma } from "@pr/database";
import type { CreateToolInput, UpdateToolInput } from "./tool.schema.js";

type CreateToolRecordInput = CreateToolInput & {
  projectId: string;
  slug: string;
};

export async function createTool(input: CreateToolRecordInput) {
  return prisma.tool.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      inputSchema: input.inputSchema as Prisma.InputJsonValue,
    },
  });
}

export async function findToolBySlug(projectId: string, slug: string) {
  return prisma.tool.findUnique({
    where: {
      projectId_slug: {
        projectId,
        slug,
      },
    },
  });
}

export async function findToolById(projectId: string, toolId: string) {
  return prisma.tool.findFirst({
    where: {
      id: toolId,
      projectId,
    },
  });
}

export async function updateTool(
  projectId: string,
  toolId: string,
  input: UpdateToolInput & { slug?: string },
) {
  return prisma.tool.updateMany({
    where: {
      id: toolId,
      projectId,
    },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      inputSchema: input.inputSchema as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listToolsByProject(projectId: string) {
  return prisma.tool.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}
