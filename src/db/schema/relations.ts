import { relations } from "drizzle-orm";
import { categories } from "./categories";
import { icons } from "./icons";

export const categoriesRelations = relations(categories, ({ many }) => ({
  icons: many(icons),
}));

export const iconsRelations = relations(icons, ({ one }) => ({
  category: one(categories, {
    fields: [icons.categoryId],
    references: [categories.id],
  }),
}));