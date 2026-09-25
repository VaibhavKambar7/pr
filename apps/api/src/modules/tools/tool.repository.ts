import { prisma, type Prisma } from "@pr/database";
import type { CreateToolInput } from "./tool.schema.js";

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

export async function listToolsByProject(projectId: string) {
  return prisma.tool.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}
