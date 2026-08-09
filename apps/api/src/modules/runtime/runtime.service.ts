import { getPromptForProject } from "../prompts/prompt.service.js";
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

function renderTemplate(template: string, variables: RenderLivePromptInput["variables"]) {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_match, variableName: string) => {
    if (!(variableName in variables)) {
      throw new MissingTemplateVariableError(variableName);
    }

    const value = variables[variableName];
    return value === null ? "" : String(value);
  });
}

export async function getLivePromptVersion(ownerId: string, projectId: string, promptId: string) {
  const prompt = await getPromptForProject(ownerId, projectId, promptId);
  const promptVersion = await findLivePromptVersion(promptId);

  if (!promptVersion) {
    throw new LivePromptVersionNotFoundError();
  }

  return {
    prompt,
    promptVersion,
  };
}

export async function renderLivePrompt(ownerId: string, projectId: string, promptId: string, input: RenderLivePromptInput) {
  const { prompt, promptVersion } = await getLivePromptVersion(ownerId, projectId, promptId);

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
