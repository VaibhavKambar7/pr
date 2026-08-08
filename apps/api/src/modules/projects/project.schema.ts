import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field is required",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
