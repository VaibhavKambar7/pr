import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createPromptVersionController,
  getPromptVersionController,
  listPromptTagsController,
  listPromptVersionsController,
  promotePromptVersionController,
  removeVersionTagController,
  rollbackPromptVersionController,
  setVersionTagController,
} from "./prompt-version.controller.js";

export async function promptVersionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/:projectId/prompts/:promptId/versions", createPromptVersionController);
  app.get("/:projectId/prompts/:promptId/versions", listPromptVersionsController);
  app.get("/:projectId/prompts/:promptId/versions/:version", getPromptVersionController);
  app.post("/:projectId/prompts/:promptId/versions/:version/promote", promotePromptVersionController);
  app.post("/:projectId/prompts/:promptId/versions/:version/rollback", rollbackPromptVersionController);
  app.put("/:projectId/prompts/:promptId/versions/:version/tag", setVersionTagController);
  app.delete("/:projectId/prompts/:promptId/tags/:tag", removeVersionTagController);
  app.get("/:projectId/prompts/:promptId/tags", listPromptTagsController);
}
