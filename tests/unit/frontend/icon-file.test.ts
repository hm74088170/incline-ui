import { describe, expect, it } from "vitest";
import { MAX_SVG_BYTES, validateSvgFile } from "@/lib/icon-file";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

const makeFile = (content: string, name = "arrow.svg") =>
  new File([content], name, { type: "image/svg+xml" });

describe("validateSvgFile", () => {
  it("accepts a normal svg and returns its text", async () => {
    expect(await validateSvgFile(makeFile(svg))).toEqual({ ok: true, svg });
  });

  it("rejects files that are not .svg", async () => {
    const res = await validateSvgFile(makeFile(svg, "arrow.png"));
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/\.svg/i) });
  });

  it("rejects an empty file", async () => {
    const res = await validateSvgFile(makeFile(""));
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/empty/i) });
  });

  it("rejects files over 100 KB", async () => {
    const big = svg + " ".repeat(MAX_SVG_BYTES);
    const res = await validateSvgFile(makeFile(big));
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/100 KB/) });
  });

  it("rejects a .svg file that has no <svg> tag", async () => {
    const res = await validateSvgFile(makeFile("hello world"));
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/valid svg/i) });
  });
});