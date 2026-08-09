import type { FastifyReply, FastifyRequest } from "fastify";
import { requireApiKey } from "../api-keys/api-key.middleware.js";
import { requireAuth } from "../auth/auth.middleware.js";

export async function requireRuntimeAuth(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return reply.code(401).send({ error: "missing bearer token" });
  }

  if (token.startsWith("pr_")) {
    return requireApiKey(request, reply);
  }

  return requireAuth(request, reply);
}
