import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import { getLivePromptVersionController, renderLivePromptController } from "./runtime.controller.js";

export async function runtimeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/projects/:projectId/prompts/:promptId/live", getLivePromptVersionController);
  app.post("/projects/:projectId/prompts/:promptId/render", renderLivePromptController);
}
