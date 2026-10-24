import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  FOREIGN_KEY_VIOLATION,
  RESTRICT_VIOLATION,
  UNIQUE_VIOLATION,
  pgErrorCode,
} from "@/db/errors";
import { categories, type Category } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/server/validators/category";

export async function listCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategory(id: string): Promise<Category> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  if (!row) throw new NotFoundError("Category not found");
  return row;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const slug = slugify(input.name);
  if (!slug) throw new ValidationError("Name must contain letters or numbers");

  try {
    const [row] = await db
      .insert(categories)
      .values({ name: input.name, slug, description: input.description ?? "" })
      .returning();
    return row;
  } catch (err) {
    if (pgErrorCode(err) === UNIQUE_VIOLATION) {
      throw new ConflictError(`A category with the slug "${slug}" already exists`);
    }
    throw err;
  }
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const [row] = await db
    .update(categories)
    .set(input)
    .where(eq(categories.id, id))
    .returning();
  if (!row) throw new NotFoundError("Category not found");
  return row;
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const [row] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    if (!row) throw new NotFoundError("Category not found");
  } catch (err) {
    const code = pgErrorCode(err);
    if (code === RESTRICT_VIOLATION || code === FOREIGN_KEY_VIOLATION) {
      throw new ConflictError("Category still has icons. Move or delete them first.");
    }
    throw err;
  }
}