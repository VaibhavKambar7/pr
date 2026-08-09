import type { FastifyReply } from "fastify";
import { ProjectConflictError, ProjectNotFoundError } from "../modules/projects/project.service.js";
import { PromptVersionNotFoundError } from "../modules/prompt-versions/prompt-version.service.js";
import { PromptConflictError, PromptNotFoundError } from "../modules/prompts/prompt.service.js";
import { LivePromptVersionNotFoundError } from "../modules/runtime/runtime.service.js";

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

  const message = error instanceof Error ? error.message : "runtime operation failed";
  return reply.code(500).send({ error: message });
}
