import { createIconSchema, listIconsQuerySchema } from "@/server/validators/icon";

const categoryId = "7b1f3a52-6c1c-4d0a-9d55-2b0d8c7f5a11";

describe("createIconSchema", () => {
  it("accepts name and categoryId, and defaults tags to []", () => {
    const r = createIconSchema.safeParse({ name: "Arrow Left", categoryId });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tags).toEqual([]);
  });

  it("trims and lowercases tags", () => {
    const r = createIconSchema.safeParse({
      name: "Arrow", categoryId, tags: ["  Direction ", "UI"],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tags).toEqual(["direction", "ui"]);
  });

  it("rejects a categoryId that is not a UUID", () => {
    expect(createIconSchema.safeParse({ name: "Arrow", categoryId: "abc" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(createIconSchema.safeParse({ name: " ", categoryId }).success).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
    expect(createIconSchema.safeParse({ name: "Arrow", categoryId, tags }).success).toBe(false);
  });
});

describe("listIconsQuerySchema", () => {
  it("applies defaults", () => {
    const r = listIconsQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(48);
  });

  it("coerces numeric strings from the URL", () => {
    const r = listIconsQuerySchema.parse({ page: "2", limit: "10", category: "arrows", q: "left" });
    expect(r).toMatchObject({ page: 2, limit: 10, category: "arrows", q: "left" });
  });

  it("rejects a limit above 100", () => {
    expect(listIconsQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("rejects page 0", () => {
    expect(listIconsQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});