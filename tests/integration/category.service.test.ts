import { db } from "@/db";
import { categories, icons } from "@/db/schema";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/server/services/category.service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

beforeEach(async () => {
  await db.delete(icons);
  await db.delete(categories);
});

const unknownId = () => crypto.randomUUID();

describe("createCategory", () => {
  it("creates a category with a generated slug", async () => {
    const c = await createCategory({ name: "Arrow Icons" });
    expect(c.slug).toBe("arrow-icons");
    expect(c.description).toBe("");
  });

  it("rejects a name that produces the same slug", async () => {
    await createCategory({ name: "Arrows" });
    await expect(createCategory({ name: "arrows!" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a name with no letters or numbers", async () => {
    await expect(createCategory({ name: "!!!" })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("listCategories / getCategory", () => {
  it("lists categories sorted by name", async () => {
    await createCategory({ name: "Weather" });
    await createCategory({ name: "Arrows" });
    const list = await listCategories();
    expect(list.map((c) => c.name)).toEqual(["Arrows", "Weather"]);
  });

  it("gets one category by id", async () => {
    const c = await createCategory({ name: "Arrows" });
    expect((await getCategory(c.id)).slug).toBe("arrows");
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(getCategory(unknownId())).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("updateCategory", () => {
  it("updates fields but keeps the slug", async () => {
    const c = await createCategory({ name: "Arrows" });
    const u = await updateCategory(c.id, { name: "Direction Arrows", description: "Pointing" });
    expect(u.name).toBe("Direction Arrows");
    expect(u.description).toBe("Pointing");
    expect(u.slug).toBe("arrows");
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(updateCategory(unknownId(), { name: "X" })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("deleteCategory", () => {
  it("deletes a category", async () => {
    const c = await createCategory({ name: "Arrows" });
    await deleteCategory(c.id);
    expect(await listCategories()).toHaveLength(0);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(deleteCategory(unknownId())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when the category still has icons", async () => {
    const c = await createCategory({ name: "Arrows" });
    await db.insert(icons).values({
      name: "Arrow Left", slug: "arrow-left", categoryId: c.id,
      svg: "<svg></svg>",
      url: "https://example.com/a.svg", publicId: "icons/arrow-left",
    });
    await expect(deleteCategory(c.id)).rejects.toBeInstanceOf(ConflictError);
    expect(await listCategories()).toHaveLength(1);
  });
});
