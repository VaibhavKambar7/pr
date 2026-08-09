import { z } from "zod";

export const listExecutionsQuerySchema = z
  .object({
    promptId: z.string().min(1).optional(),
  })
  .strict();

export type ListExecutionsQuery = z.infer<typeof listExecutionsQuerySchema>;
