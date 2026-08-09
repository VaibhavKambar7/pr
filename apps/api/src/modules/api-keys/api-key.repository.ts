import { prisma } from "@pr/database";

type CreateApiKeyRecordInput = {
  projectId: string;
  createdById: string;
  name: string;
  keyHash: string;
  prefix: string;
};

type ApiKeyIdentity = {
  id: string;
  projectId: string;
};

export async function createApiKey(input: CreateApiKeyRecordInput) {
  return prisma.apiKey.create({
    data: {
      projectId: input.projectId,
      createdById: input.createdById,
      name: input.name,
      keyHash: input.keyHash,
      prefix: input.prefix,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });
}

export async function listApiKeysByProject(projectId: string) {
  return prisma.apiKey.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });
}

export async function revokeApiKey(input: ApiKeyIdentity) {
  return prisma.apiKey.updateMany({
    where: {
      id: input.id,
      projectId: input.projectId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
