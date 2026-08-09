import { findPromptById } from "../prompts/prompt.repository.js";
import { PromptNotFoundError, getPromptForProject } from "../prompts/prompt.service.js";
import { findLivePromptVersion } from "./runtime.repository.js";
import type { RenderLivePromptInput } from "./runtime.schema.js";

export class LivePromptVersionNotFoundError extends Error {
  constructor() {
    super("no live prompt version found");
  }
}

export class MissingTemplateVariableError extends Error {
  constructor(variableName: string) {
    super(`missing template variable: ${variableName}`);
  }
}

export class RuntimeProjectAccessError extends Error {
  constructor() {
    super("runtime credential cannot access this project");
  }
}

type RuntimeAuthContext =
  | {
      type: "user";
      userId: string;
    }
  | {
      type: "apiKey";
      apiKeyId: string;
      projectId: string;
    };

function renderTemplate(template: string, variables: RenderLivePromptInput["variables"]) {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_match, variableName: string) => {
    if (!(variableName in variables)) {
      throw new MissingTemplateVariableError(variableName);
    }

    const value = variables[variableName];
    return value === null ? "" : String(value);
  });
}

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

export async function getLivePromptVersion(context: RuntimeAuthContext, projectId: string, promptId: string) {
  const prompt = await getPromptForRuntimeContext(context, projectId, promptId);
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
) {
  const { prompt, promptVersion } = await getLivePromptVersion(context, projectId, promptId);

  return {
    prompt,
    promptVersion: {
      id: promptVersion.id,
      version: promptVersion.version,
      status: promptVersion.status,
      model: promptVersion.model,
      modelParams: promptVersion.modelParams,
      createdAt: promptVersion.createdAt,
      promotedAt: promptVersion.promotedAt,
    },
    renderedPrompt: renderTemplate(promptVersion.template, input.variables),
  };
}
