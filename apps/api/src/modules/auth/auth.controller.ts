import type { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, registerUser } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = registerSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await registerUser(parsedBody.data);

    return reply.code(201).send({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "registration failed";
    const statusCode = message === "user already exists" ? 409 : 500;

    return reply.code(statusCode).send({ error: message });
  }
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = loginSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await loginUser(parsedBody.data);

    return reply.code(200).send({ user });
  } catch {
    return reply.code(401).send({ error: "invalid email or password" });
  }
}
