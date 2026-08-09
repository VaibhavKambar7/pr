import { getPromptForProject } from "../prompts/prompt.service.js";
import { findLivePromptVersion } from "./runtime.repository.js";

export class LivePromptVersionNotFoundError extends Error {
  constructor() {
    super("no live prompt version found");
  }
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
