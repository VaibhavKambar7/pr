import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import { createToolController, listToolsController } from "./tool.controller.js";

export async function toolRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/:projectId/tools", createToolController);
  app.get("/:projectId/tools", listToolsController);
}
