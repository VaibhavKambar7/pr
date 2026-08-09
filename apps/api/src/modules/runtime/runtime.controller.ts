import type { FastifyReply, FastifyRequest } from "fastify";
import "../auth/auth.types.js";
import { ProjectNotFoundError } from "../projects/project.service.js";
import { PromptNotFoundError } from "../prompts/prompt.service.js";
import { LivePromptVersionNotFoundError, getLivePromptVersion } from "./runtime.service.js";

type RuntimePromptParams = {
  projectId: string;
  promptId: string;
};

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    void reply.code(401).send({ error: "unauthorized" });
    return null;
  }

  return request.user;
}

function sendRuntimeError(reply: FastifyReply, error: unknown) {
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

export async function getLivePromptVersionController(
  request: FastifyRequest<{ Params: RuntimePromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const result = await getLivePromptVersion(user.id, request.params.projectId, request.params.promptId);

    return reply.code(200).send(result);
  } catch (error) {
    return sendRuntimeError(reply, error);
  }
}
