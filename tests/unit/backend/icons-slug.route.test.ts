import { DELETE, GET } from "@/app/api/icons/[slug]/route";
import { deleteIcon, getIcon } from "@/server/services/icon.service";
import { NotFoundError } from "@/lib/errors";

vi.mock("@/server/services/icon.service", () => ({
  createIcon: vi.fn(),
  listIcons: vi.fn(),
  getIcon: vi.fn(),
  deleteIcon: vi.fn(),
}));

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });
const req = (method: string, authorization: string | null = null) =>
  new Request("http://localhost/api/icons/arrow-left", {
    method,
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ADMIN_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/icons/[slug]", () => {
  it("returns the icon without needing a key", async () => {
    vi.mocked(getIcon).mockResolvedValue({ slug: "arrow-left", svg: "<svg/>" } as never);
    const res = await GET(req("GET"), ctx("arrow-left"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.slug).toBe("arrow-left");
  });

  it("returns 404 when the icon does not exist", async () => {
    vi.mocked(getIcon).mockRejectedValue(new NotFoundError("Icon not found"));
    const res = await GET(req("GET"), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed slug", async () => {
    const res = await GET(req("GET"), ctx("Bad Slug!"));
    expect(res.status).toBe(400);
    expect(getIcon).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/icons/[slug]", () => {
  it("deletes with the admin key and returns 204", async () => {
    vi.mocked(deleteIcon).mockResolvedValue(undefined);
    const res = await DELETE(req("DELETE", "Bearer test-key"), ctx("arrow-left"));
    expect(res.status).toBe(204);
    expect(deleteIcon).toHaveBeenCalledWith("arrow-left");
  });

  it("returns 401 without the admin key", async () => {
    const res = await DELETE(req("DELETE"), ctx("arrow-left"));
    expect(res.status).toBe(401);
    expect(deleteIcon).not.toHaveBeenCalled();
  });

  it("returns 404 when the icon does not exist", async () => {
    vi.mocked(deleteIcon).mockRejectedValue(new NotFoundError("Icon not found"));
    const res = await DELETE(req("DELETE", "Bearer test-key"), ctx("nope"));
    expect(res.status).toBe(404);
  });
});