import { GET, POST } from "@/app/api/icons/route";
import { createIcon, listIcons } from "@/server/services/icon.service";
import { ConflictError } from "@/lib/errors";
import { MAX_SVG_BYTES } from "@/server/svg/limits";

vi.mock("@/server/services/icon.service", () => ({
  createIcon: vi.fn(),
  listIcons: vi.fn(),
  getIcon: vi.fn(),
  deleteIcon: vi.fn(),
}));

const categoryId = "7b1f3a52-6c1c-4d0a-9d55-2b0d8c7f5a11";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

type UploadOptions = { file?: File | null; authorization?: string | null };

function upload(fields: Record<string, string>, opts: UploadOptions = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  const file =
    opts.file === undefined
      ? new File([svg], "arrow.svg", { type: "image/svg+xml" })
      : opts.file;
  if (file) form.set("file", file);
  const authorization =
    opts.authorization === undefined ? "Bearer test-key" : opts.authorization;
  return new Request("http://localhost/api/icons", {
    method: "POST",
    headers: authorization ? { authorization } : {},
    body: form,
  });
}

const validFields = { name: "Arrow Left", categoryId, tags: "direction, UI" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ADMIN_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/icons", () => {
  it("uploads an icon and returns 201", async () => {
    vi.mocked(createIcon).mockResolvedValue({ slug: "arrow-left" } as never);
    const res = await POST(upload(validFields));
    expect(res.status).toBe(201);
    expect(createIcon).toHaveBeenCalledWith({
      name: "Arrow Left",
      categoryId,
      tags: ["direction", "ui"],
      svg,
    });
    expect((await res.json()).data.slug).toBe("arrow-left");
  });

  it("returns 401 without the admin key", async () => {
    const res = await POST(upload(validFields, { authorization: null }));
    expect(res.status).toBe(401);
    expect(createIcon).not.toHaveBeenCalled();
  });

  it("returns 400 when the file is missing", async () => {
    const res = await POST(upload(validFields, { file: null }));
    expect(res.status).toBe(400);
    expect(createIcon).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid categoryId", async () => {
    const res = await POST(upload({ ...validFields, categoryId: "abc" }));
    expect(res.status).toBe(400);
    expect(createIcon).not.toHaveBeenCalled();
  });

  it("returns 400 when the file is too large", async () => {
    const big = new File(["a".repeat(MAX_SVG_BYTES + 1)], "big.svg", {
      type: "image/svg+xml",
    });
    const res = await POST(upload(validFields, { file: big }));
    expect(res.status).toBe(400);
    expect(createIcon).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not multipart/form-data", async () => {
    const req = new Request("http://localhost/api/icons", {
      method: "POST",
      headers: { authorization: "Bearer test-key", "content-type": "application/json" },
      body: JSON.stringify(validFields),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when the service reports a conflict", async () => {
    vi.mocked(createIcon).mockRejectedValue(new ConflictError("exists"));
    const res = await POST(upload(validFields));
    expect(res.status).toBe(409);
  });
});

describe("GET /api/icons", () => {
  it("passes the parsed query to the service and returns data with meta", async () => {
    vi.mocked(listIcons).mockResolvedValue({
      items: [{ slug: "arrow-left" }],
      total: 11,
      page: 2,
      limit: 10,
    } as never);

    const res = await GET(
      new Request("http://localhost/api/icons?category=arrows&q=left&page=2&limit=10"),
    );

    expect(res.status).toBe(200);
    expect(listIcons).toHaveBeenCalledWith({
      category: "arrows",
      q: "left",
      page: 2,
      limit: 10,
    });
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({ total: 11, page: 2, limit: 10 });
  });

  it("works without an admin key", async () => {
    vi.mocked(listIcons).mockResolvedValue({ items: [], total: 0, page: 1, limit: 48 });
    const res = await GET(new Request("http://localhost/api/icons"));
    expect(res.status).toBe(200);
  });

  it("returns 400 for an invalid limit", async () => {
    const res = await GET(new Request("http://localhost/api/icons?limit=500"));
    expect(res.status).toBe(400);
    expect(listIcons).not.toHaveBeenCalled();
  });
});