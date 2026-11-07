import { toPublicIcon } from "@/server/services/public-icon";

const icon = (isPremium: boolean) => ({
  slug: "arrow-left",
  svg: "<svg/>",
  publicId: "inclineui/icons/arrow-left",
  isPremium,
});

describe("toPublicIcon", () => {
  it("keeps the svg of a free icon", () => {
    expect(toPublicIcon(icon(false)).svg).toBe("<svg/>");
  });

  it("hides the svg of a premium icon", () => {
    expect(toPublicIcon(icon(true)).svg).toBeNull();
  });

  it("never exposes the internal publicId", () => {
    expect(toPublicIcon(icon(false))).not.toHaveProperty("publicId");
  });
});