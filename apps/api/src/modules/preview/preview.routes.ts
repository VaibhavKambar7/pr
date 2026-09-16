import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import { previewPromptVersionController } from "./preview.controller.js";

export async function previewRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post(
    "/:projectId/prompts/:promptId/versions/:versionId/preview",
    previewPromptVersionController,
  );
}
