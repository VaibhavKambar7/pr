import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createRefreshSession,
  getAuthenticatedUser,
  loginUser,
  logoutAuthSession,
  refreshAuthSession,
  registerUser,
} from "./auth.service.js";
import { loginSchema, logoutSessionSchema, refreshSessionSchema, registerSchema } from "./auth.schema.js";
import "./auth.types.js";

type AuthResult = Awaited<ReturnType<typeof registerUser>>;

async function withSessionToken(reply: FastifyReply, result: AuthResult) {
  const accessToken = await reply.jwtSign({
    sub: result.user.id,
    email: result.user.email,
  });

  const refreshToken = await createRefreshSession(result.user.id);

  return {
    ...result,
    accessToken,
    refreshToken,
  };
}

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = registerSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await registerUser(parsedBody.data);

    return reply.code(201).send(await withSessionToken(reply, result));
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
    const result = await loginUser(parsedBody.data);

    return reply.code(200).send(await withSessionToken(reply, result));
  } catch {
    return reply.code(401).send({ error: "invalid email or password" });
  }
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.code(401).send({ error: "unauthorized" });
  }

  const user = await getAuthenticatedUser(request.user.id);

  if (!user) {
    return reply.code(404).send({ error: "user not found" });
  }

  return reply.code(200).send({ user });
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = refreshSessionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
    });
  }

  try {
    const result = await refreshAuthSession(parsedBody.data);

    const accessToken = await reply.jwtSign({
      sub: result.user.id,
      email: result.user.email,
    });

    return reply.code(200).send({
      user: result.user,
      accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "refresh failed";
    const statusCode = message === "invalid refresh token" ? 401 : 500;

    return reply.code(statusCode).send({ error: message });
  }
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = logoutSessionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
    });
  }

  await logoutAuthSession(parsedBody.data);

  return reply.code(200).send({ success: true });
}
