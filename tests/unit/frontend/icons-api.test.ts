import { buildIconsQuery, fetchIcons } from "@/lib/api/icons";

afterEach(() => vi.unstubAllGlobals());

describe("buildIconsQuery", () => {
  it("returns an empty string when there are no params", () => {
    expect(buildIconsQuery()).toBe("");
    expect(buildIconsQuery({})).toBe("");
  });

  it("skips empty and undefined values", () => {
    expect(buildIconsQuery({ category: undefined, q: "" })).toBe("");
  });

  it("encodes the values", () => {
    expect(buildIconsQuery({ category: "arrows", q: "arrow left", page: 2 })).toBe(
      "?category=arrows&q=arrow+left&page=2",
    );
  });
});

describe("fetchIcons", () => {
  it("calls /api/icons with the query string", async () => {
    const payload = { data: [], meta: { total: 0, page: 1, limit: 48 } };
        const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify(payload), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchIcons({ category: "arrows" });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/icons?category=arrows");
    expect(result.meta.total).toBe(0);
  });
});