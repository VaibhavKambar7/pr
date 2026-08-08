import { getPromptForProject } from "../prompts/prompt.service.js";
import {
  createPromptVersion,
  findPromptVersion,
  getLatestPromptVersionNumber,
  listPromptVersions,
} from "./prompt-version.repository.js";
import type { CreatePromptVersionInput } from "./prompt-version.schema.js";

export class PromptVersionNotFoundError extends Error {
  constructor() {
    super("prompt version not found");
  }
}

function parseVersionNumber(value: string) {
  const version = Number(value);

  if (!Number.isInteger(version) || version <= 0) {
    throw new PromptVersionNotFoundError();
  }

  return version;
}

export async function createVersionForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
  input: CreatePromptVersionInput,
) {
  await getPromptForProject(ownerId, projectId, promptId);

  const latestVersionNumber = await getLatestPromptVersionNumber(promptId);

  return createPromptVersion({
    promptId,
    version: latestVersionNumber + 1,
    template: input.template,
    model: input.model,
    modelParams: input.modelParams,
  });
}

export async function listVersionsForPrompt(ownerId: string, projectId: string, promptId: string) {
  await getPromptForProject(ownerId, projectId, promptId);

  return listPromptVersions(promptId);
}

export async function getVersionForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
  versionParam: string,
) {
  await getPromptForProject(ownerId, projectId, promptId);

  const version = parseVersionNumber(versionParam);
  const promptVersion = await findPromptVersion({
    promptId,
    version,
  });

  if (!promptVersion) {
    throw new PromptVersionNotFoundError();
  }

  return promptVersion;
}
