import { renderPromptTemplate, validatePromptVariables } from "../../shared/prompt-rendering.js";
import { findPromptVersionForPreview } from "../prompt-versions/prompt-version.repository.js";
import { PromptVersionNotFoundError } from "../prompt-versions/prompt-version.service.js";
import { getProjectForUser } from "../projects/project.service.js";
import type { PreviewPromptInput } from "./preview.schema.js";

export async function previewPromptVersion(
  ownerId: string,
  projectId: string,
  promptId: string,
  versionId: string,
  input: PreviewPromptInput,
) {
  await getProjectForUser(ownerId, projectId);

  const promptVersion = await findPromptVersionForPreview({
    projectId,
    promptId,
    versionId,
  });

  if (!promptVersion) {
    throw new PromptVersionNotFoundError();
  }

  const variableSchema =
    promptVersion.variableSchema &&
    typeof promptVersion.variableSchema === "object" &&
    !Array.isArray(promptVersion.variableSchema)
      ? (promptVersion.variableSchema as Record<string, unknown>)
      : null;

  validatePromptVariables(variableSchema, input.variables);

  const renderedPrompt = renderPromptTemplate(
    promptVersion.template as string,
    input.variables,
  );

  return {
    promptVersion,
    renderedPrompt,
  };
}
