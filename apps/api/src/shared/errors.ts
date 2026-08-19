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
} from "../modules/prompt-versions/prompt-version.service.js";
import { VariableValidationError } from "../modules/runtime/runtime.service.js";
import { PromptConflictError, PromptNotFoundError } from "../modules/prompts/prompt.service.js";
import {
  LivePromptVersionNotFoundError,
  MissingTemplateVariableError,
  RuntimeProjectAccessError,
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

  return sendStructuredError(reply, 500, "PROMPT_VERSION_OPERATION_FAILED", error instanceof Error ? error.message : "prompt version operation failed");
}

export function sendRuntimeError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return sendStructuredError(reply, 404, "PROJECT_NOT_FOUND", error.message);
  }

  if (error instanceof PromptNotFoundError) {
    return sendStructuredError(reply, 404, "PROMPT_NOT_FOUND", error.message);
  }

  if (error instanceof LivePromptVersionNotFoundError) {
    return sendStructuredError(reply, 404, "LIVE_VERSION_NOT_FOUND", error.message);
  }

  if (error instanceof MissingTemplateVariableError) {
    return sendStructuredError(reply, 400, "MISSING_VARIABLE", error.message);
  }

  if (error instanceof VariableValidationError) {
    return sendStructuredError(reply, 400, "PROMPT_VARIABLE_VALIDATION_FAILED", error.message, error.issues);
  }

  if (error instanceof RuntimeProjectAccessError) {
    return sendStructuredError(reply, 403, "RUNTIME_PROJECT_ACCESS_DENIED", error.message);
  }

  return sendStructuredError(reply, 500, "RUNTIME_OPERATION_FAILED", error instanceof Error ? error.message : "runtime operation failed");
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
