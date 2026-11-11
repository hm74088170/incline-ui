import { GET } from "@/app/api/admin/session/route";

beforeEach(() => vi.stubEnv("ADMIN_API_KEY", "test-key"));
afterEach(() => vi.unstubAllEnvs());

const req = (authorization?: string) =>
  new Request("http://localhost/api/admin/session", {
    headers: authorization ? { authorization } : {},
  });

describe("GET /api/admin/session", () => {
  it("returns 200 for the right key", async () => {
    const res = await GET(req("Bearer test-key"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.ok).toBe(true);
  });

  it("returns 401 without a key", async () => {
    expect((await GET(req())).status).toBe(401);
  });

  it("returns 401 for a wrong key", async () => {
    expect((await GET(req("Bearer nope"))).status).toBe(401);
  });
});