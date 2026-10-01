import Ajv from "ajv";
import { z } from "zod";

const ajv = new Ajv({ allErrors: true, strict: false });

const toolInputSchema = z.record(z.string(), z.unknown()).superRefine((schema, context) => {
  if (schema.type !== "object") {
    context.addIssue({
      code: "custom",
      message: 'tool input schema root type must be "object"',
    });
    return;
  }

  try {
    ajv.compile(schema);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? `invalid JSON Schema: ${error.message}` : "invalid JSON Schema",
    });
  }
});

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
