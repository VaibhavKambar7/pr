import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import { listAuditEventsController } from "./audit-event.controller.js";

export async function auditEventRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/:projectId/audit-events", listAuditEventsController);
}
