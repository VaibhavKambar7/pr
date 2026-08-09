import type { Prisma } from "@pr/database";
import { getProjectForUser } from "../projects/project.service.js";
import { createExecution, findExecutionById, listExecutionsByProject } from "./execution.repository.js";

type RecordRenderExecutionInput = {
  projectId: string;
  promptId: string;
  promptVersionId: string;
  apiKeyId?: string;
  userId?: string;
  variables: Prisma.InputJsonValue;
  renderedPrompt: string;
  latencyMs: number;
};

export async function recordRenderExecution(input: RecordRenderExecutionInput) {
  return createExecution(input);
}

export class ExecutionNotFoundError extends Error {
  constructor() {
    super("execution not found");
  }
}

type ListExecutionsInput = {
  promptId?: string;
};

export async function listExecutionsForProject(ownerId: string, projectId: string, input: ListExecutionsInput) {
  await getProjectForUser(ownerId, projectId);

  return listExecutionsByProject({
    projectId,
    promptId: input.promptId,
  });
}

export async function getExecutionForProject(ownerId: string, projectId: string, executionId: string) {
  await getProjectForUser(ownerId, projectId);

  const execution = await findExecutionById({
    id: executionId,
    projectId,
  });

  if (!execution) {
    throw new ExecutionNotFoundError();
  }

  return execution;
}
