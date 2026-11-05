import { z } from "zod";

export const idSchema = z.string().uuid("Invalid id");

export const slugSchema = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");