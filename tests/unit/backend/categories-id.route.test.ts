import { DELETE, GET, PATCH } from "@/app/api/categories/[id]/route";
import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/server/services/category.service";
import { ConflictError, NotFoundError } from "@/lib/errors";

vi.mock("@/server/services/category.service", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  getCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const id = "7b1f3a52-6c1c-4d0a-9d55-2b0d8c7f5a11";
const category = {
  id, name: "Arrows", slug: "arrows", description: "",
  createdAt: new Date(), updatedAt: new Date(),
};

const ctx = (value: string) => ({ params: Promise.resolve({ id: value }) });
const req = (method: string, body?: unknown, authorization: string | null = "Bearer test-key") =>
  new Request(`http://localhost/api/categories/${id}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ADMIN_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/categories/[id]", () => {
  it("returns the category", async () => {
    vi.mocked(getCategory).mockResolvedValue(category);
    const res = await GET(req("GET"), ctx(id));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(id);
  });

  it("returns 400 for an id that is not a UUID", async () => {
    const res = await GET(req("GET"), ctx("abc"));
    expect(res.status).toBe(400);
    expect(getCategory).not.toHaveBeenCalled();
  });

  it("returns 404 when not found", async () => {
    vi.mocked(getCategory).mockRejectedValue(new NotFoundError("Category not found"));
    const res = await GET(req("GET"), ctx(id));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/categories/[id]", () => {
  it("updates and returns the category", async () => {
    vi.mocked(updateCategory).mockResolvedValue({ ...category, description: "New" });
    const res = await PATCH(req("PATCH", { description: "New" }), ctx(id));
    expect(res.status).toBe(200);
    expect(updateCategory).toHaveBeenCalledWith(id, { description: "New" });
  });

  it("returns 400 for an empty update", async () => {
    const res = await PATCH(req("PATCH", {}), ctx(id));
    expect(res.status).toBe(400);
    expect(updateCategory).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("returns 204 with no body", async () => {
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
    const res = await DELETE(req("DELETE"), ctx(id));
    expect(res.status).toBe(204);
    expect(deleteCategory).toHaveBeenCalledWith(id);
  });

  it("returns 409 when the category still has icons", async () => {
    vi.mocked(deleteCategory).mockRejectedValue(new ConflictError("Category still has icons"));
    const res = await DELETE(req("DELETE"), ctx(id));
    expect(res.status).toBe(409);
  });
});

describe("admin protection", () => {
  it("GET stays public", async () => {
    vi.mocked(getCategory).mockResolvedValue(category);
    const res = await GET(req("GET", undefined, null), ctx(id));
    expect(res.status).toBe(200);
  });

  it("PATCH returns 401 without the admin key", async () => {
    const res = await PATCH(req("PATCH", { description: "x" }, null), ctx(id));
    expect(res.status).toBe(401);
    expect(updateCategory).not.toHaveBeenCalled();
  });

  it("DELETE returns 401 without the admin key", async () => {
    const res = await DELETE(req("DELETE", undefined, null), ctx(id));
    expect(res.status).toBe(401);
    expect(deleteCategory).not.toHaveBeenCalled();
  });
});