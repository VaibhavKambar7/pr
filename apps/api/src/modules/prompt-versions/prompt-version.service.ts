import { createHash } from "node:crypto";
import {
  extractTemplateVariables,
  generateVariableSchemaFromTemplate,
  InvalidVariableSchemaError,
  SchemaTemplateMismatchError,
  validatePromptVariableSchema,
} from "@pr/shared";
import { getPromptForProject } from "../prompts/prompt.service.js";
import {
  createPromptVersion,
  deleteTag,
  findPromptVersion,
  findTagByPromptAndName,
  listPromptVersions,
  listTagsByPrompt,
  promotePromptVersion,
  upsertTag,
} from "./prompt-version.repository.js";
import type { CreatePromptVersionInput, SetLivePromptVersionInput, SetVersionTagInput } from "./prompt-version.schema.js";

export {
  IdempotencyKeyConflictError,
  PromptVersionConflictError,
} from "./prompt-version.repository.js";

export { InvalidVariableSchemaError, SchemaTemplateMismatchError } from "@pr/shared";

export class PromptVersionNotFoundError extends Error {
  constructor() {
    super("prompt version not found");
  }
}

export class TagNotFoundError extends Error {
  constructor(tag: string) {
    super(`tag "${tag}" not found`);
  }
}

function hashCreateVersionRequest(input: CreatePromptVersionInput) {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
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
  idempotencyKey?: string,
) {
  await getPromptForProject(ownerId, projectId, promptId);
  const variableSchema = input.variableSchema ?? generateVariableSchemaFromTemplate(input.template);

  if (variableSchema) {
    const templateVariables = extractTemplateVariables(input.template);
    const { issues } = validatePromptVariableSchema(variableSchema, templateVariables);

    if (issues.length > 0) {
      const hasSchemaStructureIssues = issues.some(
        (issue) =>
          issue.path === "variableSchema" ||
          issue.path.startsWith("variableSchema.type") ||
          issue.path.startsWith("variableSchema.$ref") ||
          issue.path.startsWith("variableSchema.properties.") === false,
      );

      if (hasSchemaStructureIssues) {
        throw new InvalidVariableSchemaError(issues);
      }

      throw new SchemaTemplateMismatchError(issues);
    }
  }

  const inputWithVariableSchema = {
    ...input,
    variableSchema,
  };

  return createPromptVersion(
    promptId,
    inputWithVariableSchema,
    idempotencyKey,
    hashCreateVersionRequest(inputWithVariableSchema),
  );
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

async function setLiveVersionForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
  versionParam: string,
  expectedLiveVersion: SetLivePromptVersionInput["expectedLiveVersion"],
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

  return promotePromptVersion({ promptId, version }, expectedLiveVersion);
}

export async function promoteVersionForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
  versionParam: string,
  expectedLiveVersion: SetLivePromptVersionInput["expectedLiveVersion"],
) {
  return setLiveVersionForPrompt(ownerId, projectId, promptId, versionParam, expectedLiveVersion);
}

export async function rollbackVersionForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
  versionParam: string,
  expectedLiveVersion: SetLivePromptVersionInput["expectedLiveVersion"],
) {
  return setLiveVersionForPrompt(ownerId, projectId, promptId, versionParam, expectedLiveVersion);
}

export async function setTagForPromptVersion(
  ownerId: string,
  projectId: string,
  promptId: string,
  versionParam: string,
  input: { tag: string },
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

  return upsertTag(promptId, promptVersion.id as string, input.tag as string);
}

export async function removeTagForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
  tag: string,
) {
  await getPromptForProject(ownerId, projectId, promptId);

  const existing = await findTagByPromptAndName(promptId, tag);

  if (!existing) {
    throw new TagNotFoundError(tag);
  }

  return deleteTag(promptId, tag);
}

export async function listTagsForPrompt(
  ownerId: string,
  projectId: string,
  promptId: string,
) {
  await getPromptForProject(ownerId, projectId, promptId);

  return listTagsByPrompt(promptId);
}
