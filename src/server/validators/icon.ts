import { z } from "zod";

const tag = z.string().trim().toLowerCase().min(1).max(30);

export const createIconSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  categoryId: z.string().uuid("Invalid categoryId"),
  tags: z.array(tag).max(20).default([]),
});

export const listIconsQuerySchema = z.object({
  category: z.string().trim().min(1).optional(), // category ka slug
  q: z.string().trim().min(1).max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(48),
});