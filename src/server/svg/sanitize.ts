import DOMPurify from "isomorphic-dompurify";
import { ValidationError } from "@/lib/errors";

export const MAX_SVG_BYTES = 100 * 1024; // 100 KB

const looksLikeSvg = (s: string) => /<svg[\s>]/i.test(s);

export function sanitizeSvg(input: string): string {
  if (Buffer.byteLength(input, "utf8") > MAX_SVG_BYTES) {
    throw new ValidationError("SVG is too large (max 100 KB)");
  }

  const trimmed = input.trim();
  if (!looksLikeSvg(trimmed)) {
    throw new ValidationError("File is not a valid SVG");
  }

  const clean = DOMPurify.sanitize(trimmed, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject"],
  });

  if (!looksLikeSvg(clean)) {
    throw new ValidationError("SVG contained no usable content");
  }
  return clean;
}