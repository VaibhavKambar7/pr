import { z } from "zod";
import type { Prisma } from "@pr/database";

export const createPromptVersionSchema = z
  .object({
    template: z.string().trim().min(1),
    model: z.string().trim().min(1).max(120).optional(),
    modelParams: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type CreatePromptVersionInput = Omit<z.infer<typeof createPromptVersionSchema>, "modelParams"> & {
  modelParams?: Prisma.InputJsonValue;
};
