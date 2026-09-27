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

export const updateToolSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().min(1).max(1_000).optional(),
    inputSchema: toolInputSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field is required",
  });

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
