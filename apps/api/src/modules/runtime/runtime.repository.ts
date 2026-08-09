import { PromptVersionStatus, prisma } from "@pr/database";

export async function findLivePromptVersion(promptId: string) {
  return prisma.promptVersion.findFirst({
    where: {
      promptId,
      status: PromptVersionStatus.LIVE,
    },
  });
}
