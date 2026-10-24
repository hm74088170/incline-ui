import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Arrow Left")).toBe("arrow-left");
  });

  it("trims and collapses repeated separators", () => {
    expect(slugify("  Arrow   --  Left  ")).toBe("arrow-left");
  });

  it("removes accents", () => {
    expect(slugify("Café Icons")).toBe("cafe-icons");
  });

  it("drops symbols", () => {
    expect(slugify("UI & UX!")).toBe("ui-ux");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("");
  });
});