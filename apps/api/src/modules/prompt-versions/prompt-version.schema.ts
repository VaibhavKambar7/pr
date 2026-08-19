import { z } from "zod";
import type { Prisma } from "@pr/database";

export const createPromptVersionSchema = z
  .object({
    template: z.string().trim().min(1),
    variableSchema: z.record(z.string(), z.unknown()).optional(),
    model: z.string().trim().min(1).max(120).optional(),
    modelParams: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type CreatePromptVersionInput = Omit<z.infer<typeof createPromptVersionSchema>, "modelParams" | "variableSchema"> & {
  modelParams?: Prisma.InputJsonValue;
  variableSchema?: Record<string, unknown>;
};

export const setLivePromptVersionSchema = z
  .object({
    expectedLiveVersion: z.number().int().positive().nullable(),
  })
  .strict();

export type SetLivePromptVersionInput = z.infer<typeof setLivePromptVersionSchema>;
