import { PromptVersionStatus, prisma, type Prisma } from "@pr/database";
import type { CreatePromptVersionInput, SetLivePromptVersionInput } from "./prompt-version.schema.js";

export class IdempotencyKeyConflictError extends Error {
  constructor() {
    super("idempotency key was already used with a different request body");
  }
}

export class PromptVersionConflictError extends Error {
  constructor(expectedLiveVersion: number | null) {
    super(
      expectedLiveVersion === null
        ? "no version is currently live"
        : `expected version ${expectedLiveVersion} to be live, but the live version has changed`,
    );
  }
}

type PromptVersionIdentity = {
  promptId: string;
  version: number;
};

function toPublicPromptVersion({
  idempotencyKey: _idempotencyKey,
  requestHash: _requestHash,
  ...promptVersion
}: {
  idempotencyKey?: string | null;
  requestHash?: string | null;
  [key: string]: unknown;
}) {
  return promptVersion;
}

async function lockPromptVersionLifecycle(tx: Prisma.TransactionClient, promptId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${promptId}, 0))`;
}

export async function createPromptVersion(
  promptId: string,
  input: CreatePromptVersionInput,
  idempotencyKey?: string,
  requestHash?: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockPromptVersionLifecycle(tx, promptId);

    if (idempotencyKey) {
      const existingVersion = await tx.promptVersion.findFirst({
        where: {
          promptId,
          idempotencyKey,
        },
      });

      if (existingVersion) {
        if (existingVersion.requestHash !== requestHash) {
          throw new IdempotencyKeyConflictError();
        }

        return {
          promptVersion: toPublicPromptVersion(existingVersion),
          replayed: true as const,
        };
      }
    }

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

    const created = await tx.promptVersion.create({
      data: {
        promptId,
        version: (latestVersion?.version ?? 0) + 1,
        template: input.template,
        variableSchema: input.variableSchema as Prisma.InputJsonValue | undefined,
        model: input.model,
        modelParams: input.modelParams,
        idempotencyKey: idempotencyKey ?? null,
        requestHash: requestHash ?? null,
      },
    });

    return {
      promptVersion: toPublicPromptVersion(created),
      replayed: false as const,
    };
  });
}

export async function listPromptVersions(promptId: string) {
  const versions = await prisma.promptVersion.findMany({
    where: {
      promptId,
    },
    orderBy: {
      version: "desc",
    },
  });

  return versions.map(toPublicPromptVersion);
}

export async function findPromptVersion(input: PromptVersionIdentity) {
  const version = await prisma.promptVersion.findUnique({
    where: {
      promptId_version: {
        promptId: input.promptId,
        version: input.version,
      },
    },
  });

  return version ? toPublicPromptVersion(version) : null;
}

export async function promotePromptVersion(
  input: PromptVersionIdentity,
  expectedLiveVersion: SetLivePromptVersionInput["expectedLiveVersion"],
) {
  return prisma.$transaction(async (tx) => {
    await lockPromptVersionLifecycle(tx, input.promptId);

    const currentLiveVersion = await tx.promptVersion.findFirst({
      where: {
        promptId: input.promptId,
        status: PromptVersionStatus.LIVE,
      },
    });

    const actualLiveVersion = currentLiveVersion?.version ?? null;

    if (actualLiveVersion === input.version) {
      return toPublicPromptVersion(currentLiveVersion!);
    }

    if (actualLiveVersion !== expectedLiveVersion) {
      throw new PromptVersionConflictError(expectedLiveVersion);
    }

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

    const promoted = await tx.promptVersion.update({
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

    return toPublicPromptVersion(promoted);
  });
}
