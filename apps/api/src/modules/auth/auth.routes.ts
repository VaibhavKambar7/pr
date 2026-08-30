import type { FastifyInstance } from "fastify";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", registerController);
  app.post("/login", loginController);
  app.post("/refresh", refreshController);
  app.post("/logout", logoutController);
  app.get("/me", { preHandler: requireAuth }, meController);
}
