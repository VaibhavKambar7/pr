import { z } from "zod";

const toolInputSchema = z.record(z.string(), z.unknown()).refine(
  (schema) => schema.type === "object",
  { message: 'tool input schema root type must be "object"' },
);

export const createToolSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().min(1).max(1_000),
    inputSchema: toolInputSchema,
  })
  .strict();

export type CreateToolInput = z.infer<typeof createToolSchema>;
