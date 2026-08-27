import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { prisma } from "@pr/database";
import { apiKeyRoutes } from "./modules/api-keys/api-key.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { AUTH_TOKEN_EXPIRES_IN, getJwtSecret } from "./modules/auth/auth.service.js";
import { executionRoutes } from "./modules/executions/execution.routes.js";
import { projectRoutes } from "./modules/projects/project.routes.js";
import { promptVersionRoutes } from "./modules/prompt-versions/prompt-version.routes.js";
import { promptRoutes } from "./modules/prompts/prompt.routes.js";
import { runtimeRoutes } from "./modules/runtime/runtime.routes.js";

export const buildApp = () => {
  const app = Fastify({
    logger: true,
  });

  void app.register(cors, {
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key"],
    exposedHeaders: ["Idempotency-Replayed"],
  });

  void app.register(fastifyJwt, {
    secret: getJwtSecret(),
    sign: {
      expiresIn: AUTH_TOKEN_EXPIRES_IN,
    },
    formatUser: (payload) => ({
      id: payload.sub,
      email: payload.email,
    }),
  });

  app.get("/health", async () => {
    let database = "ok";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "unavailable";
    }

    return {
      status: "ok",
      service: "pr-api",
      database,
      timestamp: new Date().toISOString(),
    };
  });

  void app.register(authRoutes, { prefix: "/auth" });
  void app.register(apiKeyRoutes, { prefix: "/projects" });
  void app.register(executionRoutes, { prefix: "/projects" });
  void app.register(projectRoutes, { prefix: "/projects" });
  void app.register(promptRoutes, { prefix: "/projects" });
  void app.register(promptVersionRoutes, { prefix: "/projects" });
  void app.register(runtimeRoutes, { prefix: "/runtime" });

  return app;
};
