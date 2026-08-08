import { prisma } from "@pr/database";
import type { CreatePromptVersionInput } from "./prompt-version.schema.js";

type CreatePromptVersionRecordInput = CreatePromptVersionInput & {
  promptId: string;
  version: number;
};

type PromptVersionIdentity = {
  promptId: string;
  version: number;
};

export async function getLatestPromptVersionNumber(promptId: string) {
  const latestVersion = await prisma.promptVersion.findFirst({
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

  return latestVersion?.version ?? 0;
}

export async function createPromptVersion(input: CreatePromptVersionRecordInput) {
  return prisma.promptVersion.create({
    data: {
      promptId: input.promptId,
      version: input.version,
      template: input.template,
      model: input.model,
      modelParams: input.modelParams,
    },
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
