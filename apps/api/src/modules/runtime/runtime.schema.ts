import { z } from "zod";

const templateValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const renderLivePromptSchema = z
  .object({
    variables: z.record(z.string(), templateValueSchema).default({}),
  })
  .strict();

export type RenderLivePromptInput = z.infer<typeof renderLivePromptSchema>;

export const runtimeQuerySchema = z
  .object({
    tag: z.string().optional(),
  })
  .strict();

export type RuntimeQueryInput = z.infer<typeof runtimeQuerySchema>;

export const validateToolInputSchema = z
  .object({
    input: z.record(z.string(), z.unknown()),
  })
  .strict();

export type ValidateToolInput = z.infer<typeof validateToolInputSchema>;
