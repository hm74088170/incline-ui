import { GET, POST } from "@/app/api/categories/route";
import { createCategory, listCategories } from "@/server/services/category.service";
import { ConflictError } from "@/lib/errors";

vi.mock("@/server/services/category.service", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  getCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const category = {
  id: "7b1f3a52-6c1c-4d0a-9d55-2b0d8c7f5a11",
  name: "Arrows",
  slug: "arrows",
  description: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const post = (body: unknown, authorization: string | null = "Bearer test-key") =>
  new Request("http://localhost/api/categories", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });


beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ADMIN_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/categories", () => {
  it("returns the list with 200", async () => {
    vi.mocked(listCategories).mockResolvedValue([category]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].slug).toBe("arrows");
  });
});

describe("POST /api/categories", () => {
  it("creates a category and returns 201", async () => {
    vi.mocked(createCategory).mockResolvedValue(category);
    const res = await POST(post({ name: "  Arrows  " }));
    expect(res.status).toBe(201);
    expect(createCategory).toHaveBeenCalledWith({ name: "Arrows" });
    expect((await res.json()).data.slug).toBe("arrows");
  });

  it("returns 400 for invalid input and does not call the service", async () => {
    const res = await POST(post({ name: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
  });

  it("returns 409 when the service reports a conflict", async () => {
    vi.mocked(createCategory).mockRejectedValue(new ConflictError("exists"));
    const res = await POST(post({ name: "Arrows" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

    it("returns 401 without the admin key and does not call the service", async () => {
    const res = await POST(post({ name: "Arrows" }, null));
    expect(res.status).toBe(401);
    expect(createCategory).not.toHaveBeenCalled();
  });
});