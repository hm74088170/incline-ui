import ts from "typescript";
import { svgToReactComponent, toComponentName } from "@/server/registry/svg-to-react";

const arrow =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"/></svg>';

describe("toComponentName", () => {
  it("turns a slug into PascalCase", () => {
    expect(toComponentName("arrow-left")).toBe("ArrowLeft");
    expect(toComponentName("sun")).toBe("Sun");
    expect(toComponentName("a-b-c")).toBe("ABC");
  });

  it("prefixes names that would start with a digit", () => {
    expect(toComponentName("3d-box")).toBe("Icon3dBox");
  });
});

describe("svgToReactComponent", () => {
  it("creates a named component that accepts SVG props", () => {
    const code = svgToReactComponent("ArrowLeft", arrow);
    expect(code).toContain('import type { SVGProps } from "react";');
    expect(code).toContain("export function ArrowLeft(props: SVGProps<SVGSVGElement>) {");
  });

  it("converts kebab-case attributes to camelCase", () => {
    const code = svgToReactComponent("ArrowLeft", arrow);
    expect(code).toContain('strokeWidth="2"');
    expect(code).toContain('strokeLinecap="round"');
    expect(code).not.toContain("stroke-width");
    expect(code).toContain('viewBox="0 0 24 24"');
  });

  it("replaces fixed width/height with 1em and lets props override", () => {
    const code = svgToReactComponent("ArrowLeft", arrow);
    expect(code).not.toContain('width="24"');
    expect(code).toContain('width="1em"');
    expect(code).toContain('height="1em"');
    expect(code.match(/\{\.\.\.props\}/g)).toHaveLength(1);
    expect(code.indexOf("{...props}")).toBeGreaterThan(code.indexOf('height="1em"'));
  });

  it("self-closes empty elements", () => {
    const code = svgToReactComponent("ArrowLeft", arrow);
    expect(code).toContain('<path d="M19 12H5" />');
    expect(code).not.toContain("</path>");
  });

  it("renames class, xlink and namespace attributes", () => {
    const code = svgToReactComponent(
      "X",
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon"><use xlink:href="#a"/></svg>',
    );
    expect(code).toContain('className="icon"');
    expect(code).not.toContain("class=");
    expect(code).toContain("xmlnsXlink=");
    expect(code).toContain('xlinkHref="#a"');
  });

  it("keeps aria-* and data-* attributes as they are", () => {
    const code = svgToReactComponent(
      "X",
      '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-name="x"></svg>',
    );
    expect(code).toContain('aria-hidden="true"');
    expect(code).toContain('data-name="x"');
  });

  it("converts inline style strings to style objects", () => {
    const code = svgToReactComponent(
      "X",
      '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:red;stroke-width:2" d="M0 0"/></svg>',
    );
    expect(code).toContain('style={{ "fill": "red", "strokeWidth": "2" }}');
  });

  it("escapes braces in text so the JSX stays valid", () => {
    const code = svgToReactComponent(
      "X",
      '<svg xmlns="http://www.w3.org/2000/svg"><text>{a}</text></svg>',
    );
    expect(code).toContain("&#123;a&#125;");
  });

  it("drops <style> blocks", () => {
    const code = svgToReactComponent(
      "X",
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:red}</style><path d="M0 0"/></svg>',
    );
    expect(code).not.toContain("<style");
    expect(code).not.toContain("fill:red");
    expect(code).toContain("<path");
  });

  it("throws when there is no <svg> element", () => {
    expect(() => svgToReactComponent("X", "<div/>")).toThrow();
  });

  it("produces syntactically valid TSX", () => {
    const code = svgToReactComponent(
      "Mixed",
      '<svg xmlns="http://www.w3.org/2000/svg" class="i"><g class="a"><path style="fill:red" d="M0 0"/></g><text>{a}</text></svg>',
    );
    const result = ts.transpileModule(code, {
      fileName: "icon.tsx",
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    expect(result.diagnostics ?? []).toHaveLength(0);
  });
});