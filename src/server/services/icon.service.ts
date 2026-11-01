import { and, asc, count, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { UNIQUE_VIOLATION, pgErrorCode } from "@/db/errors";
import { categories, icons, type Icon } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import { cloudinaryStorage } from "@/server/storage/cloudinary";
import type { IconStorage } from "@/server/storage/types";
import { sanitizeSvg } from "@/server/svg/sanitize";

export type CreateIconInput = {
  name: string;
  categoryId: string;
  tags?: string[];
  svg: string;
};

export type ListIconsParams = {
  category?: string; // category ka slug
  q?: string;
  page?: number;
  limit?: number;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export async function createIcon(
  input: CreateIconInput,
  storage: IconStorage = cloudinaryStorage,
): Promise<Icon> {
  const slug = slugify(input.name);
  if (!slug) throw new ValidationError("Name must contain letters or numbers");

  const svg = sanitizeSvg(input.svg);

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, input.categoryId));
  if (!category) throw new NotFoundError("Category not found");

  const [existing] = await db
    .select({ id: icons.id })
    .from(icons)
    .where(eq(icons.slug, slug));
  if (existing) throw new ConflictError(`An icon with the slug "${slug}" already exists`);

  const asset = await storage.uploadSvg(svg, `inclineui/icons/${slug}`);

  try {
    const [row] = await db
      .insert(icons)
      .values({
        name: input.name,
        slug,
        categoryId: input.categoryId,
        svg,
        url: asset.url,
        publicId: asset.publicId,
        format: "svg",
        sizeBytes: Buffer.byteLength(svg, "utf8"),
        tags: input.tags ?? [],
      })
      .returning();
    return row;
  } catch (err) {
    // Duplicate: file kisi doosre icon ki ho sakti hai, isliye hatana nahi.
    if (pgErrorCode(err) === UNIQUE_VIOLATION) {
      throw new ConflictError(`An icon with the slug "${slug}" already exists`);
    }
    // Baaki errors me hamari upload ki hui file orphan ho jati, to hata do (best effort).
    await storage.deleteAsset(asset.publicId).catch((e) => {
      console.error("Failed to clean up asset", asset.publicId, e);
    });
    throw err;
  }
}

export async function listIcons({ category, q, page = 1, limit = 48 }: ListIconsParams) {
  const filters: (SQL | undefined)[] = [];
  if (category) filters.push(eq(categories.slug, category));
  if (q) {
    filters.push(
      or(
        ilike(icons.name, `%${escapeLike(q)}%`),
        sql`${icons.tags} @> ARRAY[${q.toLowerCase()}]::text[]`,
      ),
    );
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: icons.id,
        name: icons.name,
        slug: icons.slug,
        url: icons.url,
        format: icons.format,
        sizeBytes: icons.sizeBytes,
        tags: icons.tags,
        isPremium: icons.isPremium,
        categoryId: icons.categoryId,
        categorySlug: categories.slug,
        categoryName: categories.name,
        createdAt: icons.createdAt,
      })
      .from(icons)
      .innerJoin(categories, eq(icons.categoryId, categories.id))
      .where(where)
      .orderBy(asc(icons.name))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(icons)
      .innerJoin(categories, eq(icons.categoryId, categories.id))
      .where(where),
  ]);

  return { items, total, page, limit };
}

export async function getIcon(slug: string) {
  const icon = await db.query.icons.findFirst({
    where: eq(icons.slug, slug),
    with: { category: true },
  });
  if (!icon) throw new NotFoundError("Icon not found");
  return icon;
}

export async function deleteIcon(
  slug: string,
  storage: IconStorage = cloudinaryStorage,
): Promise<void> {
  // Pehle DB se hatao: storage fail ho to sirf ek orphan file bachti hai,
  // ulta karne par DB me aisa icon bachta jiski image gayab hai.
  const [row] = await db
    .delete(icons)
    .where(eq(icons.slug, slug))
    .returning({ publicId: icons.publicId });
  if (!row) throw new NotFoundError("Icon not found");

  await storage.deleteAsset(row.publicId).catch((err) => {
    console.error("Failed to delete asset", row.publicId, err);
  });
}