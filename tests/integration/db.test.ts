import { db } from "@/db";
import { categories, icons } from "@/db/schema";

beforeEach(async () => {
  await db.delete(icons);
  await db.delete(categories);
});

async function makeCategory() {
  const [c] = await db
    .insert(categories)
    .values({ name: "Arrows", slug: "arrows" })
    .returning();
  return c;
}

it("stores an icon under a category", async () => {
  const cat = await makeCategory();
  await db.insert(icons).values({
    name: "Arrow Left",
    slug: "arrow-left",
    categoryId: cat.id,
    url: "https://res.cloudinary.com/demo/arrow-left.svg",
    publicId: "icons/arrow-left",
    svg: "<svg></svg>",
  });
  const rows = await db.select().from(icons);
  expect(rows).toHaveLength(1);
  expect(rows[0].categoryId).toBe(cat.id);
});

it("rejects duplicate icon slugs", async () => {
  const cat = await makeCategory();
  const row = { name: "A", slug: "dup", categoryId: cat.id, url: "u1", publicId: "p1", svg: "<svg></svg>" };
  await db.insert(icons).values(row);
  await expect(db.insert(icons).values({ ...row, publicId: "p2" })).rejects.toThrow();
});

it("blocks deleting a category that still has icons", async () => {
  const cat = await makeCategory();
  await db.insert(icons).values({
    name: "A", slug: "a", categoryId: cat.id, url: "u", publicId: "p", svg: "<svg></svg>",
  });
  await expect(db.delete(categories)).rejects.toThrow();
});

it("defaults isPremium to false and tags to empty", async () => {
  const cat = await makeCategory();
  const [icon] = await db
    .insert(icons)
    .values({
      name: "Arrow Left",
      slug: "arrow-left",
      categoryId: cat.id,
      svg: "<svg></svg>",
      url: "https://example.com/a.svg",
      publicId: "icons/arrow-left",
    })
    .returning();
  expect(icon.isPremium).toBe(false);
  expect(icon.tags).toEqual([]);
});

it("stores premium icons with tags", async () => {
  const cat = await makeCategory();
  const [icon] = await db
    .insert(icons)
    .values({
      name: "Crown",
      slug: "crown",
      categoryId: cat.id,
      svg: "<svg></svg>",
      url: "https://example.com/c.svg",
      publicId: "icons/crown",
      isPremium: true,
      tags: ["king", "royal"],
    })
    .returning();
  expect(icon.isPremium).toBe(true);
  expect(icon.tags).toEqual(["king", "royal"]);
});
