import { prisma, type Prisma } from "@pr/database";

type CreateExecutionInput = {
  projectId: string;
  promptId: string;
  promptVersionId: string;
  apiKeyId?: string;
  userId?: string;
  variables: Prisma.InputJsonValue;
  renderedPrompt: string;
  output?: string;
  latencyMs?: number;
};

export async function createExecution(input: CreateExecutionInput) {
  return prisma.execution.create({
    data: {
      projectId: input.projectId,
      promptId: input.promptId,
      promptVersionId: input.promptVersionId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      variables: input.variables,
      renderedPrompt: input.renderedPrompt,
      output: input.output,
      latencyMs: input.latencyMs,
    },
    select: {
      id: true,
      createdAt: true,
      latencyMs: true,
    },
  });
}
