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

type ListExecutionsInput = {
  projectId: string;
  promptId?: string;
};

type ExecutionIdentity = {
  id: string;
  projectId: string;
};

export async function listExecutionsByProject(input: ListExecutionsInput) {
  return prisma.execution.findMany({
    where: {
      projectId: input.projectId,
      promptId: input.promptId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      latencyMs: true,
      output: true,
      error: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      costUsd: true,
      createdAt: true,
      prompt: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      promptVersion: {
        select: {
          id: true,
          version: true,
          status: true,
          model: true,
        },
      },
      apiKey: {
        select: {
          id: true,
          name: true,
          prefix: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export async function findExecutionById(input: ExecutionIdentity) {
  return prisma.execution.findFirst({
    where: {
      id: input.id,
      projectId: input.projectId,
    },
    select: {
      id: true,
      projectId: true,
      promptId: true,
      promptVersionId: true,
      apiKeyId: true,
      userId: true,
      variables: true,
      renderedPrompt: true,
      output: true,
      latencyMs: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      costUsd: true,
      error: true,
      createdAt: true,
      prompt: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      promptVersion: {
        select: {
          id: true,
          version: true,
          status: true,
          model: true,
          modelParams: true,
          createdAt: true,
          promotedAt: true,
        },
      },
      apiKey: {
        select: {
          id: true,
          name: true,
          prefix: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}
