import type { Prisma } from "@pr/database";
import Ajv from "ajv";
import { recordRenderExecution } from "../executions/execution.service.js";
import { findPromptById } from "../prompts/prompt.repository.js";
import { PromptNotFoundError, getPromptForProject } from "../prompts/prompt.service.js";
import { findLivePromptVersion } from "./runtime.repository.js";
import type { RenderLivePromptInput } from "./runtime.schema.js";

export class LivePromptVersionNotFoundError extends Error {
  constructor() {
    super("no live prompt version found");
  }
}

export class VariableValidationError extends Error {
  public readonly issues: Array<{ path: string; message: string }>;

  constructor(
    issues: Array<{ path: string; keyword: string; message: string }>,
  ) {
    super("prompt variables failed validation");
    this.issues = issues.map((issue) => ({
      path: issue.path,
      message: formatAjvMessage(issue.keyword, issue.message),
    }));
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

function formatAjvPath(instancePath: string): string {
  return instancePath || "/";
}

function formatAjvMessage(keyword: string, defaultMessage: string): string {
  switch (keyword) {
    case "type":
      return defaultMessage;
    case "enum":
      return defaultMessage;
    case "required":
      return defaultMessage;
    case "minLength":
      return defaultMessage;
    case "maxLength":
      return defaultMessage;
    case "pattern":
      return defaultMessage;
    case "minimum":
      return defaultMessage;
    case "maximum":
      return defaultMessage;
    default:
      return defaultMessage;
  }
}

const compiledValidators = new Map<string, ReturnType<Ajv["compile"]>>();
const ajvInstance = new Ajv({ allErrors: true, strict: false });

function getCompiledValidator(schema: Record<string, unknown>) {
  const key = JSON.stringify(schema);
  const cached = compiledValidators.get(key);

  if (cached) {
    return cached;
  }

  const validate = ajvInstance.compile(schema);
  compiledValidators.set(key, validate);

  if (compiledValidators.size > 1000) {
    const firstKey = compiledValidators.keys().next().value;

    if (firstKey !== undefined) {
      compiledValidators.delete(firstKey);
    }
  }

  return validate;
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
  const startedAt = Date.now();
  const { prompt, promptVersion } = await getLivePromptVersion(context, projectId, promptId);

  if (promptVersion.variableSchema && typeof promptVersion.variableSchema === "object") {
    const validate = getCompiledValidator(promptVersion.variableSchema as Record<string, unknown>);
    const valid = validate(input.variables);

    if (!valid) {
      const issues = (validate.errors ?? []).map((err) => ({
        path: formatAjvPath(err.instancePath),
        keyword: err.keyword ?? "validation",
        message: err.message ?? "validation failed",
      }));

      throw new VariableValidationError(issues);
    }
  }

  const renderedPrompt = renderTemplate(promptVersion.template, input.variables);
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
