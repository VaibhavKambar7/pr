import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createToolController,
  deleteToolController,
  getToolController,
  listToolsController,
  updateToolController,
} from "./tool.controller.js";

export async function toolRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/:projectId/tools", createToolController);
  app.get("/:projectId/tools", listToolsController);
  app.get("/:projectId/tools/:toolId", getToolController);
  app.patch("/:projectId/tools/:toolId", updateToolController);
  app.delete("/:projectId/tools/:toolId", deleteToolController);
}
