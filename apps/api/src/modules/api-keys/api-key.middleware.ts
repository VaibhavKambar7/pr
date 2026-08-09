import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyApiKey } from "./api-key.service.js";

export async function requireApiKey(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return reply.code(401).send({ error: "missing bearer token" });
  }

  const apiKey = await verifyApiKey(token);

  if (!apiKey) {
    return reply.code(401).send({ error: "invalid api key" });
  }

  request.apiKey = apiKey;
}
