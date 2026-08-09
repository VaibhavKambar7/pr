import type { FastifyInstance } from "fastify";
import { requireRuntimeAuth } from "./runtime.middleware.js";
import { getLivePromptVersionController, renderLivePromptController } from "./runtime.controller.js";

export async function runtimeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireRuntimeAuth);

  app.get("/projects/:projectId/prompts/:promptId/live", getLivePromptVersionController);
  app.post("/projects/:projectId/prompts/:promptId/render", renderLivePromptController);
}
