import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import { getExecutionController, listExecutionsController } from "./execution.controller.js";

export async function executionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/:projectId/executions", listExecutionsController);
  app.get("/:projectId/executions/:executionId", getExecutionController);
}
