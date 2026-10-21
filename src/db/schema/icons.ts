import { pgTable, uuid, text, integer, index } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { timestamps } from "./_helpers";

export const icons = pgTable(
  "icons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    // Cloudinary
    url: text("url").notNull(),
    publicId: text("public_id").notNull().unique(),

    format: text("format").notNull().default("svg"),
    sizeBytes: integer("size_bytes"),
    ...timestamps,
  },
  (t) => [index("icons_category_id_idx").on(t.categoryId)],
);

export type Icon = typeof icons.$inferSelect;
export type NewIcon = typeof icons.$inferInsert;