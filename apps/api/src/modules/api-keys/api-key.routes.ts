import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import { createApiKeyController, listApiKeysController, revokeApiKeyController } from "./api-key.controller.js";

export async function apiKeyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/:projectId/api-keys", createApiKeyController);
  app.get("/:projectId/api-keys", listApiKeysController);
  app.delete("/:projectId/api-keys/:apiKeyId", revokeApiKeyController);
}
