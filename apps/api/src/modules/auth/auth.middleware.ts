import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAuthToken } from "./auth.service.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return reply.code(401).send({ error: "missing bearer token" });
  }

  const user = verifyAuthToken(token);

  if (!user) {
    return reply.code(401).send({ error: "invalid bearer token" });
  }

  request.user = user;
}
