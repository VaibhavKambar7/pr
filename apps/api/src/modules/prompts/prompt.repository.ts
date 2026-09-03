import { AuditAction, prisma, type Prisma } from "@pr/database";
import type { CreatePromptInput, UpdatePromptInput } from "./prompt.schema.js";

type CreatePromptRecordInput = CreatePromptInput & {
  projectId: string;
  ownerId: string;
  slug: string;
};

type PromptIdentity = {
  id: string;
  projectId: string;
};

type PromptAuditSnapshot = {
  name: string;
  slug: string;
  description: string | null;
};

function toPromptAuditSnapshot(prompt: PromptAuditSnapshot) {
  return {
    name: prompt.name,
    slug: prompt.slug,
    description: prompt.description,
  };
}

async function createPromptAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string;
    actorId: string;
    action: AuditAction;
    entityId: string;
    before: PromptAuditSnapshot | null;
    after: PromptAuditSnapshot | null;
  },
) {
  await tx.auditEvent.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId,
      action: input.action,
      entityType: "prompt",
      entityId: input.entityId,
      before: input.before ? toPromptAuditSnapshot(input.before) : undefined,
      after: input.after ? toPromptAuditSnapshot(input.after) : undefined,
    },
  });
}

export async function createPrompt(input: CreatePromptRecordInput) {
  return prisma.$transaction(async (tx) => {
    const prompt = await tx.prompt.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        projectId: input.projectId,
      },
    });

    await createPromptAuditEvent(tx, {
      projectId: input.projectId,
      actorId: input.ownerId,
      action: AuditAction.PROMPT_CREATED,
      entityId: prompt.id,
      before: null,
      after: prompt,
    });

    return prompt;
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

export async function updatePrompt(input: PromptIdentity & UpdatePromptInput & { ownerId: string }) {
  return prisma.$transaction(async (tx) => {
    const existingPrompt = await tx.prompt.findFirst({
      where: {
        id: input.id,
        projectId: input.projectId,
      },
    });

    if (!existingPrompt) {
      return { count: 0 };
    }

    const updatedPrompt = await tx.prompt.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
    });

    await createPromptAuditEvent(tx, {
      projectId: input.projectId,
      actorId: input.ownerId,
      action: AuditAction.PROMPT_UPDATED,
      entityId: updatedPrompt.id,
      before: existingPrompt,
      after: updatedPrompt,
    });

    return { count: 1 };
  });
}

export async function deletePrompt(input: PromptIdentity & { ownerId: string }) {
  return prisma.$transaction(async (tx) => {
    const existingPrompt = await tx.prompt.findFirst({
      where: {
        id: input.id,
        projectId: input.projectId,
      },
    });

    if (!existingPrompt) {
      return { count: 0 };
    }

    await tx.prompt.delete({
      where: {
        id: input.id,
      },
    });

    await createPromptAuditEvent(tx, {
      projectId: input.projectId,
      actorId: input.ownerId,
      action: AuditAction.PROMPT_DELETED,
      entityId: existingPrompt.id,
      before: existingPrompt,
      after: null,
    });

    return { count: 1 };
  });
}
