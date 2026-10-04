import type { FastifyInstance } from "fastify";
import {
  getRuntimeToolController,
  listRuntimeToolsController,
  validateRuntimeToolInputController,
} from "./runtime-tool.controller.js";
import { requireRuntimeAuth } from "./runtime.middleware.js";
import { getLivePromptVersionController, renderLivePromptController } from "./runtime.controller.js";

export async function runtimeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireRuntimeAuth);

  app.get("/projects/:projectId/prompts/:promptId/live", getLivePromptVersionController);
  app.post("/projects/:projectId/prompts/:promptId/render", renderLivePromptController);
  app.get("/projects/:projectId/tools", listRuntimeToolsController);
  app.get("/projects/:projectId/tools/:toolSlug", getRuntimeToolController);
  app.post(
    "/projects/:projectId/tools/:toolSlug/validate",
    validateRuntimeToolInputController,
  );
}
