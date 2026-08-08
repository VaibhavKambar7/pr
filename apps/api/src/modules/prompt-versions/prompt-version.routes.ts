import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createPromptVersionController,
  getPromptVersionController,
  listPromptVersionsController,
} from "./prompt-version.controller.js";

export async function promptVersionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/:projectId/prompts/:promptId/versions", createPromptVersionController);
  app.get("/:projectId/prompts/:promptId/versions", listPromptVersionsController);
  app.get("/:projectId/prompts/:promptId/versions/:version", getPromptVersionController);
}
