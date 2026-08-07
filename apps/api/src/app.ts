import Fastify from "fastify";
import { prisma } from "@pr/database";
import { authRoutes } from "./modules/auth/auth.routes.js";

export const buildApp = () => {
  const app = Fastify({
    logger: true,
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

  return app;
};
