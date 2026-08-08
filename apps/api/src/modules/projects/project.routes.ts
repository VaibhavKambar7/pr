import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from "./project.controller.js";

export async function projectRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/", createProjectController);
  app.get("/", listProjectsController);
  app.get("/:projectId", getProjectController);
  app.patch("/:projectId", updateProjectController);
  app.delete("/:projectId", deleteProjectController);
}
