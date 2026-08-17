import type { FastifyReply } from "fastify";
import { ApiKeyNotFoundError } from "../modules/api-keys/api-key.service.js";
import { ExecutionNotFoundError } from "../modules/executions/execution.service.js";
import { ProjectConflictError, ProjectNotFoundError } from "../modules/projects/project.service.js";
import {
  IdempotencyKeyConflictError,
  PromptVersionConflictError,
  PromptVersionNotFoundError,
} from "../modules/prompt-versions/prompt-version.service.js";
import { PromptConflictError, PromptNotFoundError } from "../modules/prompts/prompt.service.js";
import {
  LivePromptVersionNotFoundError,
  MissingTemplateVariableError,
  RuntimeProjectAccessError,
} from "../modules/runtime/runtime.service.js";

export function sendProjectError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof ProjectConflictError) {
    return reply.code(409).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "project operation failed";
  return reply.code(500).send({ error: message });
}

export function sendPromptError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof PromptNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof PromptConflictError) {
    return reply.code(409).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "prompt operation failed";
  return reply.code(500).send({ error: message });
}

export function sendPromptVersionError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof PromptNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof PromptVersionNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof IdempotencyKeyConflictError) {
    return reply.code(409).send({ error: error.message });
  }

  if (error instanceof PromptVersionConflictError) {
    return reply.code(409).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "prompt version operation failed";
  return reply.code(500).send({ error: message });
}

export function sendRuntimeError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof PromptNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof LivePromptVersionNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof MissingTemplateVariableError) {
    return reply.code(400).send({ error: error.message });
  }

  if (error instanceof RuntimeProjectAccessError) {
    return reply.code(403).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "runtime operation failed";
  return reply.code(500).send({ error: message });
}

export function sendApiKeyError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof ApiKeyNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "api key operation failed";
  return reply.code(500).send({ error: message });
}

export function sendExecutionError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof ExecutionNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "execution operation failed";
  return reply.code(500).send({ error: message });
}
