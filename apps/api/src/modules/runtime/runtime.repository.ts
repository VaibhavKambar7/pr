import { PromptVersionStatus, prisma } from "@pr/database";

export async function findLivePromptVersion(promptId: string) {
  return prisma.promptVersion.findFirst({
    where: {
      promptId,
      status: PromptVersionStatus.LIVE,
    },
  });
}

export async function findPromptVersionByTag(promptId: string, tag: string) {
  const tagRecord = await prisma.promptVersionTag.findUnique({
    where: {
      promptId_tag: {
        promptId,
        tag,
      },
    },
    include: {
      version: true,
    },
  });

  return tagRecord?.version ?? null;
}
