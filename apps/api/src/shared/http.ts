import type { FastifyReply, FastifyRequest } from "fastify";
import "../modules/auth/auth.types.js";

export function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    void reply.code(401).send({ error: "unauthorized" });
    return null;
  }

  return request.user;
}
