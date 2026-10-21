import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { timestamps } from "./_helpers";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  ...timestamps,
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;