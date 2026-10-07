import Ajv from "ajv";
import { z } from "zod";

const ajv = new Ajv({ allErrors: true, strict: false });

const MAX_TOOL_SCHEMA_SIZE_BYTES = 32_768;
const MAX_TOOL_SCHEMA_DEPTH = 10;

function inspectSchema(value: unknown) {
  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 1 }];
  const visited = new WeakSet<object>();
  let maxDepth = 0;
  let remoteReference: string | null = null;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current.value !== "object" || current.value === null) continue;
    if (visited.has(current.value)) continue;

    visited.add(current.value);
    maxDepth = Math.max(maxDepth, current.depth);

    for (const [key, child] of Object.entries(current.value)) {
      if (key === "$ref" && typeof child === "string" && !child.startsWith("#")) {
        remoteReference = child;
      }

      pending.push({ value: child, depth: current.depth + 1 });
    }
  }

  return { maxDepth, remoteReference };
}

const toolInputSchema = z.record(z.string(), z.unknown()).superRefine((schema, context) => {
  if (schema.type !== "object") {
    context.addIssue({
      code: "custom",
      message: 'tool input schema root type must be "object"',
    });
    return;
  }

  try {
    const schemaSize = Buffer.byteLength(JSON.stringify(schema), "utf8");
    if (schemaSize > MAX_TOOL_SCHEMA_SIZE_BYTES) {
      context.addIssue({
        code: "custom",
        message: `tool input schema must not exceed ${MAX_TOOL_SCHEMA_SIZE_BYTES} bytes`,
      });
      return;
    }

    const { maxDepth, remoteReference } = inspectSchema(schema);
    if (maxDepth > MAX_TOOL_SCHEMA_DEPTH) {
      context.addIssue({
        code: "custom",
        message: `tool input schema must not exceed ${MAX_TOOL_SCHEMA_DEPTH} levels`,
      });
      return;
    }

    if (remoteReference) {
      context.addIssue({
        code: "custom",
        message: `remote JSON Schema references are not supported: ${remoteReference}`,
      });
      return;
    }

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
    enabled: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field is required",
  });

export const validateRegisteredToolInputSchema = z
  .object({
    input: z.record(z.string(), z.unknown()),
  })
  .strict();

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
