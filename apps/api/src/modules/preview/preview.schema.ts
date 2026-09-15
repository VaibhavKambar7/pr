import { z } from "zod";

const templateValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const previewPromptSchema = z
  .object({
    variables: z.record(z.string(), templateValueSchema).default({}),
  })
  .strict();

export type PreviewPromptInput = z.infer<typeof previewPromptSchema>;
