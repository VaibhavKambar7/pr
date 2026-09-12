import type { FastifyReply } from "fastify";
import { ApiKeyNotFoundError } from "../modules/api-keys/api-key.service.js";
import { ExecutionNotFoundError } from "../modules/executions/execution.service.js";
import { ProjectConflictError, ProjectNotFoundError } from "../modules/projects/project.service.js";
import {
  IdempotencyKeyConflictError,
  InvalidVariableSchemaError,
  PromptVersionConflictError,
  PromptVersionNotFoundError,
  SchemaTemplateMismatchError,
  TagNotFoundError,
} from "../modules/prompt-versions/prompt-version.service.js";
import { VariableValidationError } from "../modules/runtime/runtime.service.js";
import { PromptConflictError, PromptNotFoundError } from "../modules/prompts/prompt.service.js";
import {
  LivePromptVersionNotFoundError,
  MissingTemplateVariableError,
  RuntimeProjectAccessError,
  TagVersionNotFoundError,
} from "../modules/runtime/runtime.service.js";

function sendStructuredError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  issues?: Array<{ path: string; message: string }>,
) {
  const body: Record<string, unknown> = {
    error: { code, message, ...(issues !== undefined ? { issues } : {}) },
  };

  return reply.code(statusCode).send(body);
}

export function getRuntimeErrorDetails(error: unknown): { statusCode: number; errorCode: string } {
  if (error instanceof ProjectNotFoundError) {
    return { statusCode: 404, errorCode: "PROJECT_NOT_FOUND" };
  }

  if (error instanceof PromptNotFoundError) {
    return { statusCode: 404, errorCode: "PROMPT_NOT_FOUND" };
  }

  if (error instanceof LivePromptVersionNotFoundError) {
    return { statusCode: 404, errorCode: "LIVE_VERSION_NOT_FOUND" };
  }

  if (error instanceof MissingTemplateVariableError) {
    return { statusCode: 400, errorCode: "MISSING_VARIABLE" };
  }

  if (error instanceof VariableValidationError) {
    return { statusCode: 400, errorCode: "PROMPT_VARIABLE_VALIDATION_FAILED" };
  }

  if (error instanceof RuntimeProjectAccessError) {
    return { statusCode: 403, errorCode: "RUNTIME_PROJECT_ACCESS_DENIED" };
  }

  if (error instanceof TagVersionNotFoundError) {
    return { statusCode: 404, errorCode: "TAG_VERSION_NOT_FOUND" };
  }

  return { statusCode: 500, errorCode: "RUNTIME_OPERATION_FAILED" };
}

export function sendApiKeyAuthError(
  reply: FastifyReply,
  code: "API_KEY_MISSING" | "API_KEY_INVALID",
  message: string,
) {
  return sendStructuredError(reply, 401, code, message);
}

export function sendProjectError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return sendStructuredError(reply, 404, "PROJECT_NOT_FOUND", error.message);
  }

  if (error instanceof ProjectConflictError) {
    return sendStructuredError(reply, 409, "PROJECT_CONFLICT", error.message);
  }

  return sendStructuredError(reply, 500, "PROJECT_OPERATION_FAILED", error instanceof Error ? error.message : "project operation failed");
}

export function sendPromptError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return sendStructuredError(reply, 404, "PROJECT_NOT_FOUND", error.message);
  }

  if (error instanceof PromptNotFoundError) {
    return sendStructuredError(reply, 404, "PROMPT_NOT_FOUND", error.message);
  }

  if (error instanceof PromptConflictError) {
    return sendStructuredError(reply, 409, "PROMPT_CONFLICT", error.message);
  }

  return sendStructuredError(reply, 500, "PROMPT_OPERATION_FAILED", error instanceof Error ? error.message : "prompt operation failed");
}

export function sendPromptVersionError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return sendStructuredError(reply, 404, "PROJECT_NOT_FOUND", error.message);
  }

  if (error instanceof PromptNotFoundError) {
    return sendStructuredError(reply, 404, "PROMPT_NOT_FOUND", error.message);
  }

  if (error instanceof PromptVersionNotFoundError) {
    return sendStructuredError(reply, 404, "PROMPT_VERSION_NOT_FOUND", error.message);
  }

  if (error instanceof IdempotencyKeyConflictError) {
    return sendStructuredError(reply, 409, "IDEMPOTENCY_CONFLICT", error.message);
  }

  if (error instanceof PromptVersionConflictError) {
    return sendStructuredError(reply, 409, "VERSION_CONFLICT", error.message);
  }

  if (error instanceof InvalidVariableSchemaError) {
    return sendStructuredError(reply, 400, "INVALID_VARIABLE_SCHEMA", error.message, error.issues);
  }

  if (error instanceof SchemaTemplateMismatchError) {
    return sendStructuredError(reply, 400, "SCHEMA_TEMPLATE_MISMATCH", error.message, error.issues);
  }

  if (error instanceof TagNotFoundError) {
    return sendStructuredError(reply, 404, "TAG_NOT_FOUND", error.message);
  }

  return sendStructuredError(reply, 500, "PROMPT_VERSION_OPERATION_FAILED", error instanceof Error ? error.message : "prompt version operation failed");
}

export function sendRuntimeError(reply: FastifyReply, error: unknown) {
  const details = getRuntimeErrorDetails(error);

  return sendStructuredError(
    reply,
    details.statusCode,
    details.errorCode,
    error instanceof Error ? error.message : "runtime operation failed",
    error instanceof VariableValidationError ? error.issues : undefined,
  );
}

export function sendApiKeyError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return sendStructuredError(reply, 404, "PROJECT_NOT_FOUND", error.message);
  }

  if (error instanceof ApiKeyNotFoundError) {
    return sendStructuredError(reply, 404, "API_KEY_NOT_FOUND", error.message);
  }

  return sendStructuredError(reply, 500, "API_KEY_OPERATION_FAILED", error instanceof Error ? error.message : "api key operation failed");
}

export function sendExecutionError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return sendStructuredError(reply, 404, "PROJECT_NOT_FOUND", error.message);
  }

  if (error instanceof ExecutionNotFoundError) {
    return sendStructuredError(reply, 404, "EXECUTION_NOT_FOUND", error.message);
  }

  return sendStructuredError(reply, 500, "EXECUTION_OPERATION_FAILED", error instanceof Error ? error.message : "execution operation failed");
}
