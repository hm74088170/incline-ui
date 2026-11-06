type Token =
  | { kind: "open"; name: string; attrs: string; selfClosing: boolean }
  | { kind: "close"; name: string }
  | { kind: "text"; value: string };

const ATTR_RENAMES: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  "xlink:href": "xlinkHref",
  "xmlns:xlink": "xmlnsXlink",
  "xml:space": "xmlSpace",
};

const toCamel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function convertAttrName(name: string): string {
  if (ATTR_RENAMES[name]) return ATTR_RENAMES[name];
  if (name.startsWith("aria-") || name.startsWith("data-")) return name;
  return toCamel(name);
}

export function toComponentName(slug: string): string {
  const pascal = slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
  return /^[0-9]/.test(pascal) ? `Icon${pascal}` : pascal;
}

function styleToObject(css: string): string {
  const entries: string[] = [];
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith("--") ? prop : toCamel(prop);
    entries.push(`${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  }
  return `{{ ${entries.join(", ")} }}`;
}

function convertAttrs(raw: string, isRoot: boolean): string[] {
  const out: string[] = [];
  for (const m of raw.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)) {
    const name = m[1];
    const value = m[2] ?? m[3];
    if (isRoot && (name === "width" || name === "height")) continue;
    if (/^on/i.test(name)) continue; // event handlers kabhi nahi
    if (name === "style" && value !== undefined) {
      out.push(`style=${styleToObject(value)}`);
      continue;
    }
    const jsxName = convertAttrName(name);
    if (value === undefined) {
      out.push(jsxName);
      continue;
    }
    out.push(
      value.includes('"') ? `${jsxName}={${JSON.stringify(value)}}` : `${jsxName}="${value}"`,
    );
  }
  if (isRoot) out.push('width="1em"', 'height="1em"', "{...props}");
  return out;
}

function tokenize(svg: string): Token[] {
  const tokens: Token[] = [];
  for (const part of svg.split(/(<[^>]*>)/)) {
    if (!part) continue;
    if (!part.startsWith("<")) {
      const value = part.trim();
      if (value) tokens.push({ kind: "text", value });
      continue;
    }
    if (part.startsWith("<!") || part.startsWith("<?")) continue;
    const close = /^<\/\s*([^\s>]+)\s*>$/.exec(part);
    if (close) {
      tokens.push({ kind: "close", name: close[1] });
      continue;
    }
    const open = /^<([^\s/>]+)([\s\S]*?)(\/?)>$/.exec(part);
    if (open) {
      tokens.push({ kind: "open", name: open[1], attrs: open[2], selfClosing: open[3] === "/" });
    }
  }
  return tokens;
}

const escapeText = (s: string) =>
  s.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/>/g, "&gt;");

function emitOpen(name: string, attrs: string[], selfClose: boolean, pad: string): string[] {
  const end = selfClose ? "/>" : ">";
  if (attrs.length <= 3) {
    return [`${pad}<${[name, ...attrs].join(" ")}${selfClose ? " />" : ">"}`];
  }
  return [`${pad}<${name}`, ...attrs.map((a) => `${pad}  ${a}`), `${pad}${end}`];
}

function render(tokens: Token[]): string[] {
  const lines: string[] = [];
  let depth = 0;
  let rootDone = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const pad = "  ".repeat(depth);

    if (t.kind === "text") {
      lines.push(pad + escapeText(t.value));
      continue;
    }
    if (t.kind === "close") {
      depth = Math.max(0, depth - 1);
      lines.push(`${"  ".repeat(depth)}</${t.name}>`);
      continue;
    }

    const isRoot = !rootDone && t.name === "svg";
    if (isRoot) rootDone = true;
    const attrs = convertAttrs(t.attrs, isRoot);

    const next = tokens[i + 1];
    const emptyPair = !t.selfClosing && next?.kind === "close" && next.name === t.name;
    if (t.selfClosing || emptyPair) {
      lines.push(...emitOpen(t.name, attrs, true, pad));
      if (emptyPair) i++;
      continue;
    }
    lines.push(...emitOpen(t.name, attrs, false, pad));
    depth++;
  }
  return lines;
}

export function svgToReactComponent(componentName: string, svg: string): string {
  const withoutStyles = svg.replace(/<style[\s\S]*?<\/style>/gi, "");
  const tokens = tokenize(withoutStyles);
  if (!tokens.some((t) => t.kind === "open" && t.name === "svg")) {
    throw new Error("Expected an <svg> element");
  }

  return [
    `import type { SVGProps } from "react";`,
    ``,
    `export function ${componentName}(props: SVGProps<SVGSVGElement>) {`,
    `  return (`,
    ...render(tokens).map((l) => `    ${l}`),
    `  );`,
    `}`,
    ``,
  ].join("\n");
}