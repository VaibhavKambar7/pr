import type { FastifyReply, FastifyRequest } from "fastify";
import { sendApiKeyAuthError } from "../../shared/errors.js";
import { verifyApiKey } from "./api-key.service.js";

export async function requireApiKey(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return sendApiKeyAuthError(reply, "API_KEY_MISSING", "missing API key");
  }

  const apiKey = await verifyApiKey(token);

  if (!apiKey) {
    return sendApiKeyAuthError(reply, "API_KEY_INVALID", "invalid API key");
  }

  request.apiKey = apiKey;
}
