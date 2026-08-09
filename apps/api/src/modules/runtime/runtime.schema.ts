import { z } from "zod";

const templateValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const renderLivePromptSchema = z
  .object({
    variables: z.record(z.string(), templateValueSchema).default({}),
  })
  .strict();

export type RenderLivePromptInput = z.infer<typeof renderLivePromptSchema>;
