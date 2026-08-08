import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createPromptController,
  deletePromptController,
  getPromptController,
  listPromptsController,
  updatePromptController,
} from "./prompt.controller.js";

export async function promptRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/:projectId/prompts", createPromptController);
  app.get("/:projectId/prompts", listPromptsController);
  app.get("/:projectId/prompts/:promptId", getPromptController);
  app.patch("/:projectId/prompts/:promptId", updatePromptController);
  app.delete("/:projectId/prompts/:promptId", deletePromptController);
}
