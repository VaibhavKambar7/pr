import type { FastifyReply, FastifyRequest } from "fastify";
import { sendRuntimeError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import { getLivePromptVersion } from "./runtime.service.js";

type RuntimePromptParams = {
  projectId: string;
  promptId: string;
};

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
