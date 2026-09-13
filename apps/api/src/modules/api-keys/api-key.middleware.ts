import type { FastifyReply, FastifyRequest } from "fastify";
import { sendApiKeyAuthError } from "../../shared/errors.js";
import { verifyApiKey } from "./api-key.service.js";

export type ApiKeyAuthFailureReason = "missing_key" | "invalid_or_revoked_key";

export function logApiKeyAuthFailure(request: FastifyRequest, reason: ApiKeyAuthFailureReason) {
  request.log.warn(
    {
      event: "api_key.authentication.failed",
      authType: "api_key",
      failureReason: reason,
      method: request.method,
      route: request.routeOptions.url,
      statusCode: 401,
    },
    "API key authentication failed",
  );
}

export async function requireApiKey(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    logApiKeyAuthFailure(request, "missing_key");
    return sendApiKeyAuthError(reply, "API_KEY_MISSING", "missing API key");
  }

  const apiKey = await verifyApiKey(token);

  if (!apiKey) {
    logApiKeyAuthFailure(request, "invalid_or_revoked_key");
    return sendApiKeyAuthError(reply, "API_KEY_INVALID", "invalid API key");
  }

  request.apiKey = apiKey;
}
