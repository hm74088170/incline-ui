import { sanitizeSvg, MAX_SVG_BYTES } from "@/server/svg/sanitize";
import { ValidationError } from "@/lib/errors";

const good =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

describe("sanitizeSvg", () => {
  it("keeps a clean icon intact", () => {
    const out = sanitizeSvg(good);
    expect(out).toContain("<svg");
    expect(out).toContain('d="M5 12h14"');
    expect(out).toContain("viewBox");
  });

  it("removes <script> tags", () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>',
    );
    expect(out).not.toContain("script");
    expect(out).toContain("<path");
  });

  it("removes inline event handlers", () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path d="M0 0"/></svg>',
    );
    expect(out).not.toContain("onload");
  });

  it("removes javascript: links", () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>',
    );
    expect(out).not.toContain("javascript:");
  });

  it("removes <foreignObject>", () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>hi</div></foreignObject><path d="M0 0"/></svg>',
    );
    expect(out.toLowerCase()).not.toContain("foreignobject");
  });

  it("rejects content that is not an SVG", () => {
    expect(() => sanitizeSvg("<div>hello</div>")).toThrow(ValidationError);
  });

  it("rejects an SVG that is too large", () => {
    const big = `<svg xmlns="http://www.w3.org/2000/svg"><!--${"a".repeat(MAX_SVG_BYTES)}--></svg>`;
    expect(() => sanitizeSvg(big)).toThrow(ValidationError);
  });
});