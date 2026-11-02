import { db } from "@/db";
import { categories, icons } from "@/db/schema";
import { createCategory } from "@/server/services/category.service";
import { createIcon, deleteIcon, getIcon, listIcons } from "@/server/services/icon.service";
import type { IconStorage } from "@/server/storage/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

function makeStorage() {
  return {
    uploadSvg: vi.fn(async (_svg: string, publicId: string) => ({
      url: `https://cdn.test/${publicId}.svg`,
      publicId,
    })),
    deleteAsset: vi.fn(async (_publicId: string) => {}),
  } satisfies IconStorage;
}

beforeEach(async () => {
  await db.delete(icons);
  await db.delete(categories);
});

async function seed(name: string, categoryId: string, tags: string[] = []) {
  return createIcon({ name, categoryId, tags, svg }, makeStorage());
}

describe("createIcon", () => {
  it("uploads the SVG and stores the icon", async () => {
    const cat = await createCategory({ name: "Arrows" });
    const storage = makeStorage();

    const icon = await createIcon(
      { name: "Arrow Left", categoryId: cat.id, tags: ["direction"], svg },
      storage,
    );

    expect(icon.slug).toBe("arrow-left");
    expect(icon.publicId).toBe("inclineui/icons/arrow-left");
    expect(icon.url).toBe("https://cdn.test/inclineui/icons/arrow-left.svg");
    expect(icon.tags).toEqual(["direction"]);
    expect(icon.isPremium).toBe(false);
    expect(icon.sizeBytes).toBeGreaterThan(0);
    expect(storage.uploadSvg).toHaveBeenCalledTimes(1);
  });

  it("sanitizes the SVG before uploading and storing it", async () => {
    const cat = await createCategory({ name: "Arrows" });
    const storage = makeStorage();
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>';

    const icon = await createIcon({ name: "Evil", categoryId: cat.id, svg: dirty }, storage);

    expect(icon.svg).not.toContain("script");
    expect(storage.uploadSvg.mock.calls[0][0]).not.toContain("script");
  });

  it("throws NotFoundError for an unknown category and uploads nothing", async () => {
    const storage = makeStorage();
    await expect(
      createIcon({ name: "Arrow", categoryId: crypto.randomUUID(), svg }, storage),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(storage.uploadSvg).not.toHaveBeenCalled();
  });

  it("throws ConflictError for a duplicate slug and uploads nothing", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Arrow Left", cat.id);

    const storage = makeStorage();
    await expect(
      createIcon({ name: "arrow left!", categoryId: cat.id, svg }, storage),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(storage.uploadSvg).not.toHaveBeenCalled();
  });

  it("throws ValidationError for content that is not an SVG", async () => {
    const cat = await createCategory({ name: "Arrows" });
    const storage = makeStorage();
    await expect(
      createIcon({ name: "Nope", categoryId: cat.id, svg: "<div>hi</div>" }, storage),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(storage.uploadSvg).not.toHaveBeenCalled();
  });

  it("removes the uploaded file when saving to the database fails", async () => {
    const cat = await createCategory({ name: "Arrows" });
    const storage = makeStorage();
    // url null hone se DB insert NOT NULL error dega
    storage.uploadSvg.mockResolvedValueOnce({
      url: null as unknown as string,
      publicId: "inclineui/icons/broken",
    });

    await expect(
      createIcon({ name: "Broken", categoryId: cat.id, svg }, storage),
    ).rejects.toThrow();
    expect(storage.deleteAsset).toHaveBeenCalledWith("inclineui/icons/broken");
  });

  it("never deletes a file when the failure is a duplicate (it may belong to another icon)", async () => {
    const cat = await createCategory({ name: "Arrows" });
    const first = await seed("Alpha", cat.id);

    const storage = makeStorage();
    // doosra icon, par storage wahi publicId lauta raha hai jo Alpha ka hai
    storage.uploadSvg.mockResolvedValueOnce({
      url: "https://cdn.test/x.svg",
      publicId: first.publicId,
    });

    await expect(
      createIcon({ name: "Beta", categoryId: cat.id, svg }, storage),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(storage.deleteAsset).not.toHaveBeenCalled();
  });
});

describe("listIcons", () => {
  it("returns items without the svg body, with category info and a total", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Arrow Left", cat.id);

    const result = await listIcons({});
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      slug: "arrow-left",
      categorySlug: "arrows",
      categoryName: "Arrows",
    });
    expect(result.items[0]).not.toHaveProperty("svg");
  });

  it("filters by category slug", async () => {
    const arrows = await createCategory({ name: "Arrows" });
    const weather = await createCategory({ name: "Weather" });
    await seed("Arrow Left", arrows.id);
    await seed("Sun", weather.id);

    const result = await listIcons({ category: "weather" });
    expect(result.items.map((i) => i.slug)).toEqual(["sun"]);
  });

  it("searches by name, case-insensitively", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Arrow Left", cat.id);
    await seed("Sun", cat.id);

    const result = await listIcons({ q: "ARROW" });
    expect(result.items.map((i) => i.slug)).toEqual(["arrow-left"]);
  });

  it("searches by tag", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Sun", cat.id, ["bright"]);
    await seed("Moon", cat.id, ["dark"]);

    const result = await listIcons({ q: "Bright" });
    expect(result.items.map((i) => i.slug)).toEqual(["sun"]);
  });

  it("treats % in the search text literally", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Arrow Left", cat.id);

    const result = await listIcons({ q: "%" });
    expect(result.total).toBe(0);
  });

  it("paginates, sorted by name", async () => {
    const cat = await createCategory({ name: "Arrows" });
    for (const n of ["Icon A", "Icon B", "Icon C", "Icon D", "Icon E"]) {
      await seed(n, cat.id);
    }

    const page2 = await listIcons({ page: 2, limit: 2 });
    expect(page2.total).toBe(5);
    expect(page2.items.map((i) => i.slug)).toEqual(["icon-c", "icon-d"]);
  });
});

describe("getIcon", () => {
  it("returns the icon with svg and its category", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Arrow Left", cat.id);

    const icon = await getIcon("arrow-left");
    expect(icon.svg).toContain("<svg");
    expect(icon.category.slug).toBe("arrows");
  });

  it("throws NotFoundError for an unknown slug", async () => {
    await expect(getIcon("nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("deleteIcon", () => {
  it("removes the row and the stored file", async () => {
    const cat = await createCategory({ name: "Arrows" });
    const icon = await seed("Arrow Left", cat.id);
    const storage = makeStorage();

    await deleteIcon("arrow-left", storage);

    expect((await listIcons({})).total).toBe(0);
    expect(storage.deleteAsset).toHaveBeenCalledWith(icon.publicId);
  });

  it("throws NotFoundError for an unknown slug", async () => {
    await expect(deleteIcon("nope", makeStorage())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("still succeeds when removing the stored file fails", async () => {
    const cat = await createCategory({ name: "Arrows" });
    await seed("Arrow Left", cat.id);
    const storage = makeStorage();
    storage.deleteAsset.mockRejectedValueOnce(new Error("cloudinary down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(deleteIcon("arrow-left", storage)).resolves.toBeUndefined();
    expect((await listIcons({})).total).toBe(0);
    spy.mockRestore();
  });
});