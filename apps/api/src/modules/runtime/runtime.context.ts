import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../shared/http.js";
import type { RuntimeAuthContext } from "./runtime.service.js";

export function getRuntimeContext(
  request: FastifyRequest,
  reply: FastifyReply,
): RuntimeAuthContext | null {
  if (request.apiKey) {
    return {
      type: "apiKey",
      apiKeyId: request.apiKey.id,
      projectId: request.apiKey.projectId,
    };
  }

  const user = requireUser(request, reply);

  if (!user) {
    return null;
  }

  return {
    type: "user",
    userId: user.id,
  };
}
