import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email(),
    password: z.string().min(8).max(100),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8).max(100),
  })
  .strict();

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(20),
}).strict();

export const logoutSessionSchema = z.object({
  refreshToken: z.string().min(20),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshSessionInput = z.infer<typeof refreshSessionSchema>;
export type LogoutSessionInput = z.infer<typeof logoutSessionSchema>;
