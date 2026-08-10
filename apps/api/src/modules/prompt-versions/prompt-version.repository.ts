import { PromptVersionStatus, prisma, type Prisma } from "@pr/database";
import type { CreatePromptVersionInput } from "./prompt-version.schema.js";

type PromptVersionIdentity = {
  promptId: string;
  version: number;
};

async function lockPromptVersionLifecycle(tx: Prisma.TransactionClient, promptId: string) {
  // Serialize version creation and promotion for a prompt without requiring a
  // mutable counter or schema change. Transaction-level locks release on commit.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${promptId}, 0))`;
}

export async function createPromptVersion(promptId: string, input: CreatePromptVersionInput) {
  return prisma.$transaction(async (tx) => {
    await lockPromptVersionLifecycle(tx, promptId);

    const latestVersion = await tx.promptVersion.findFirst({
      where: {
        promptId,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

    return tx.promptVersion.create({
      data: {
        promptId,
        version: (latestVersion?.version ?? 0) + 1,
        template: input.template,
        model: input.model,
        modelParams: input.modelParams,
      },
    });
  });
}

export async function listPromptVersions(promptId: string) {
  return prisma.promptVersion.findMany({
    where: {
      promptId,
    },
    orderBy: {
      version: "desc",
    },
  });
}

export async function findPromptVersion(input: PromptVersionIdentity) {
  return prisma.promptVersion.findUnique({
    where: {
      promptId_version: {
        promptId: input.promptId,
        version: input.version,
      },
    },
  });
}

export async function promotePromptVersion(input: PromptVersionIdentity) {
  return prisma.$transaction(async (tx) => {
    await lockPromptVersionLifecycle(tx, input.promptId);

    await tx.promptVersion.updateMany({
      where: {
        promptId: input.promptId,
        status: PromptVersionStatus.LIVE,
      },
      data: {
        status: PromptVersionStatus.DRAFT,
        promotedAt: null,
      },
    });

    return tx.promptVersion.update({
      where: {
        promptId_version: {
          promptId: input.promptId,
          version: input.version,
        },
      },
      data: {
        status: PromptVersionStatus.LIVE,
        promotedAt: new Date(),
        archivedAt: null,
      },
    });
  });
}
