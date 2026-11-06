import { buildIconRegistryItem } from "@/server/registry/icon-item";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

describe("buildIconRegistryItem", () => {
  it("builds a registry item with a generated component file", () => {
    const item = buildIconRegistryItem({
      slug: "arrow-left",
      name: "Arrow Left",
      svg,
      tags: ["direction"],
      category: { slug: "arrows", name: "Arrows" },
    });

    expect(item).toMatchObject({
      name: "arrow-left",
      title: "Arrow Left",
      type: "registry:icon",
      category: "arrows",
      tags: ["direction"],
      componentName: "ArrowLeft",
      dependencies: [],
    });
    expect(item.files).toHaveLength(1);
    expect(item.files[0].path).toBe("icons/arrow-left.tsx");
    expect(item.files[0].content).toContain("export function ArrowLeft");
  });
});