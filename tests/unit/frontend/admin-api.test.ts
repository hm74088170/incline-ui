import {
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory,
  verifyAdminKey,
} from "@/lib/api/admin";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, init, headers: new Headers(init.headers) };
};

describe("admin API", () => {
  it("verifies a key against the session endpoint", async () => {
    await verifyAdminKey("k");
    const { url, headers } = lastCall();
    expect(url).toBe("/api/admin/session");
    expect(headers.get("authorization")).toBe("Bearer k");
  });

  it("creates a category with a JSON body", async () => {
    await adminCreateCategory("k", { name: "Arrows" });
    const { url, init, headers } = lastCall();
    expect(url).toBe("/api/categories");
    expect(init.method).toBe("POST");
    expect(headers.get("authorization")).toBe("Bearer k");
    expect(headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({ name: "Arrows" });
  });

  it("updates a category", async () => {
    await adminUpdateCategory("k", "c1", { description: "New" });
    const { url, init } = lastCall();
    expect(url).toBe("/api/categories/c1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ description: "New" });
  });

  it("deletes a category", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
    await expect(adminDeleteCategory("k", "c1")).resolves.toBeUndefined();
    const { url, init, headers } = lastCall();
    expect(url).toBe("/api/categories/c1");
    expect(init.method).toBe("DELETE");
    expect(headers.get("authorization")).toBe("Bearer k");
  });
});