import { GET } from "@/app/api/registry/icons/[slug]/route";
import { getIcon } from "@/server/services/icon.service";
import { NotFoundError } from "@/lib/errors";

vi.mock("@/server/services/icon.service", () => ({
  createIcon: vi.fn(),
  listIcons: vi.fn(),
  getIcon: vi.fn(),
  deleteIcon: vi.fn(),
}));

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

const icon = (overrides: Record<string, unknown> = {}) =>
  ({
    slug: "arrow-left",
    name: "Arrow Left",
    svg,
    tags: ["direction"],
    isPremium: false,
    category: { slug: "arrows", name: "Arrows" },
    ...overrides,
  }) as never;

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });
const req = () => new Request("http://localhost/api/registry/icons/arrow-left");

beforeEach(() => vi.resetAllMocks());

describe("GET /api/registry/icons/[slug]", () => {
  it("returns the registry item for a free icon", async () => {
    vi.mocked(getIcon).mockResolvedValue(icon());
    const res = await GET(req(), ctx("arrow-left"));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe("arrow-left");
    expect(data.files[0].path).toBe("icons/arrow-left.tsx");
    expect(data.files[0].content).toContain("export function ArrowLeft");
  });

  it("does not leak the raw svg field", async () => {
    vi.mocked(getIcon).mockResolvedValue(icon());
    const res = await GET(req(), ctx("arrow-left"));
    expect((await res.json()).data).not.toHaveProperty("svg");
  });

  it("returns 403 for a premium icon and sends no code", async () => {
    vi.mocked(getIcon).mockResolvedValue(icon({ isPremium: true }));
    const res = await GET(req(), ctx("arrow-left"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(JSON.stringify(body)).not.toContain("export function");
  });

  it("returns 404 when the icon does not exist", async () => {
    vi.mocked(getIcon).mockRejectedValue(new NotFoundError("Icon not found"));
    const res = await GET(req(), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed slug", async () => {
    const res = await GET(req(), ctx("Bad Slug!"));
    expect(res.status).toBe(400);
    expect(getIcon).not.toHaveBeenCalled();
  });
});