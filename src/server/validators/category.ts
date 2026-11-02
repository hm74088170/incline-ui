import { z } from "zod";

const name = z.string().trim().min(1, "Name is required").max(60);
const description = z.string().trim().max(300);

export const createCategorySchema = z.object({
  name,
  description: description.optional(),
});

export const updateCategorySchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;