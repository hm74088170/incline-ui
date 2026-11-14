export const MAX_SVG_BYTES = 100 * 1024;

export type SvgFileResult =
  | { ok: true; svg: string }
  | { ok: false; error: string };

export async function validateSvgFile(file: File): Promise<SvgFileResult> {
  if (!file.name.toLowerCase().endsWith(".svg")) {
    return { ok: false, error: "Choose a .svg file." };
  }
  if (file.size === 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (file.size > MAX_SVG_BYTES) {
    return { ok: false, error: "SVG must be 100 KB or smaller." };
  }
  const svg = await file.text();
  if (!/<svg[\s>]/i.test(svg)) {
    return { ok: false, error: "This does not look like a valid SVG." };
  }
  return { ok: true, svg };
}