import { z } from "zod";

export const createApiKeySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
  })
  .strict();

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
