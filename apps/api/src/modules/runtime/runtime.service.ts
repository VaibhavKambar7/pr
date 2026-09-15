import type { Prisma } from "@pr/database";
import { renderPromptTemplate, validatePromptVariables } from "../../shared/prompt-rendering.js";
import { recordRenderExecution } from "../executions/execution.service.js";
import { findPromptById } from "../prompts/prompt.repository.js";
import { PromptNotFoundError, getPromptForProject } from "../prompts/prompt.service.js";
import { findPromptVersionByTag, findLivePromptVersion } from "./runtime.repository.js";
import type { RenderLivePromptInput } from "./runtime.schema.js";

export class LivePromptVersionNotFoundError extends Error {
  constructor() {
    super("no live prompt version found");
  }
}

export class TagVersionNotFoundError extends Error {
  constructor(tag: string) {
    super(`no prompt version found for tag "${tag}"`);
  }
}

export class RuntimeProjectAccessError extends Error {
  constructor() {
    super("runtime credential cannot access this project");
  }
}

export type RuntimeAuthContext =
  | {
      type: "user";
      userId: string;
    }
  | {
      type: "apiKey";
      apiKeyId: string;
      projectId: string;
    };

async function getPromptForRuntimeContext(context: RuntimeAuthContext, projectId: string, promptId: string) {
  if (context.type === "apiKey") {
    if (context.projectId !== projectId) {
      throw new RuntimeProjectAccessError();
    }

    const prompt = await findPromptById({
      id: promptId,
      projectId,
    });

    if (!prompt) {
      throw new PromptNotFoundError();
    }

    return prompt;
  }

  return getPromptForProject(context.userId, projectId, promptId);
}

export async function getLivePromptVersion(
  context: RuntimeAuthContext,
  projectId: string,
  promptId: string,
  tag?: string,
) {
  const prompt = await getPromptForRuntimeContext(context, projectId, promptId);

  if (tag) {
    const promptVersion = await findPromptVersionByTag(promptId, tag);

    if (!promptVersion) {
      throw new TagVersionNotFoundError(tag);
    }

    return {
      prompt,
      promptVersion,
    };
  }

  const promptVersion = await findLivePromptVersion(promptId);

  if (!promptVersion) {
    throw new LivePromptVersionNotFoundError();
  }

  return {
    prompt,
    promptVersion,
  };
}

export async function renderLivePrompt(
  context: RuntimeAuthContext,
  projectId: string,
  promptId: string,
  input: RenderLivePromptInput,
  tag?: string,
) {
  const startedAt = Date.now();
  const { prompt, promptVersion } = await getLivePromptVersion(context, projectId, promptId, tag);

  const variableSchema =
    promptVersion.variableSchema && typeof promptVersion.variableSchema === "object"
      ? (promptVersion.variableSchema as Record<string, unknown>)
      : null;

  validatePromptVariables(variableSchema, input.variables);
  const renderedPrompt = renderPromptTemplate(promptVersion.template, input.variables);
  const execution = await recordRenderExecution({
    projectId,
    promptId: prompt.id,
    promptVersionId: promptVersion.id,
    apiKeyId: context.type === "apiKey" ? context.apiKeyId : undefined,
    userId: context.type === "user" ? context.userId : undefined,
    variables: input.variables as Prisma.InputJsonValue,
    renderedPrompt,
    latencyMs: Date.now() - startedAt,
  });

  return {
    executionId: execution.id,
    prompt,
    promptVersion: {
      id: promptVersion.id,
      version: promptVersion.version,
      status: promptVersion.status,
      variableSchema: promptVersion.variableSchema,
      model: promptVersion.model,
      modelParams: promptVersion.modelParams,
      createdAt: promptVersion.createdAt,
      promotedAt: promptVersion.promotedAt,
    },
    renderedPrompt,
  };
}
