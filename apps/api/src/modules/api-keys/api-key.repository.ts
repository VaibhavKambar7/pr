import { AuditAction, prisma, type Prisma } from "@pr/database";

type CreateApiKeyRecordInput = {
  projectId: string;
  ownerId: string;
  createdById: string;
  name: string;
  keyHash: string;
  prefix: string;
};

type ApiKeyIdentity = {
  id: string;
  projectId: string;
};

type ApiKeyAuditSnapshot = {
  name: string;
  prefix: string;
  revokedAt?: Date | null;
};

async function createApiKeyAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string;
    actorId: string;
    action: AuditAction;
    entityId: string;
    before: ApiKeyAuditSnapshot | null;
    after: ApiKeyAuditSnapshot | null;
  },
) {
  await tx.auditEvent.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId,
      action: input.action,
      entityType: "api_key",
      entityId: input.entityId,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
    },
  });
}

export async function createApiKey(input: CreateApiKeyRecordInput) {
  return prisma.$transaction(async (tx) => {
    const apiKey = await tx.apiKey.create({
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

    await createApiKeyAuditEvent(tx, {
      projectId: input.projectId,
      actorId: input.ownerId,
      action: AuditAction.API_KEY_CREATED,
      entityId: apiKey.id,
      before: null,
      after: {
        name: input.name,
        prefix: input.prefix,
      },
    });

    return apiKey;
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

export async function findActiveApiKeyByHash(keyHash: string) {
  return prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
    },
    select: {
      id: true,
      projectId: true,
    },
  });
}

export async function touchApiKeyLastUsedAt(id: string) {
  return prisma.apiKey.update({
    where: {
      id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });
}
