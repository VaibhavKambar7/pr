import type { Prisma } from "@pr/database";
import { createExecution } from "./execution.repository.js";

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
