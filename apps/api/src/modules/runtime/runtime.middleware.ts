import type { FastifyReply, FastifyRequest } from "fastify";
import { sendApiKeyAuthError } from "../../shared/errors.js";
import { requireApiKey } from "../api-keys/api-key.middleware.js";
import { requireAuth } from "../auth/auth.middleware.js";

export async function requireRuntimeAuth(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return sendApiKeyAuthError(reply, "API_KEY_MISSING", "missing API key");
  }

  if (token.startsWith("pr_")) {
    return requireApiKey(request, reply);
  }

  return requireAuth(request, reply);
}
