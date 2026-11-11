import { ApiError, apiFetch } from "@/lib/api/client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("returns the parsed JSON on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ data: [1, 2] })));
    await expect(apiFetch("/api/x")).resolves.toEqual({ data: [1, 2] });
  });

  it("throws an ApiError with status, code and message from the error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ error: { code: "CONFLICT", message: "Already exists" } }, 409)),
    );
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: "CONFLICT", message: "Already exists" });
  });

  it("falls back to a generic ApiError when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Bad gateway", { status: 502 })),
    );
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
        expect(err).toMatchObject({ status: 502 });
  });

  it("returns undefined for 204 No Content", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await expect(apiFetch("/api/x", { method: "DELETE" })).resolves.toBeUndefined();
  });
});