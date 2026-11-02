import { createCategorySchema, updateCategorySchema } from "@/server/validators/category";

describe("createCategorySchema", () => {
  it("accepts a name and trims it", () => {
    const r = createCategorySchema.safeParse({ name: "  Arrows  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Arrows");
  });

  it("accepts an optional description", () => {
    expect(
      createCategorySchema.safeParse({ name: "Arrows", description: "Direction icons" }).success,
    ).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(createCategorySchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(createCategorySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a name longer than 60 characters", () => {
    expect(createCategorySchema.safeParse({ name: "a".repeat(61) }).success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("accepts a partial update", () => {
    expect(updateCategorySchema.safeParse({ description: "New text" }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(updateCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });
});