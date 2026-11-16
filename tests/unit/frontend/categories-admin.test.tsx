import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoriesAdmin } from "@/components/admin/categories-admin";
import type { Category } from "@/lib/api/types";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/components/admin/admin-provider", () => ({
  useAdmin: () => ({ status: "authed", key: "good-key", signIn: vi.fn(), signOut }),
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const makeCategory = (name: string, description = ""): Category => ({
  id: crypto.randomUUID(),
  name,
  slug: name.toLowerCase(),
  description,
  createdAt: "",
  updatedAt: "",
});

let store: Category[];
let failNext: { status: number; code: string; message: string } | null;
const fetchMock = vi.fn();

beforeEach(() => {
  store = [makeCategory("Arrows", "Direction icons")];
  failNext = null;
  signOut.mockReset();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";

    if (method !== "GET" && failNext) {
      const f = failNext;
      failNext = null;
      return json({ error: { code: f.code, message: f.message } }, f.status);
    }
    if (url === "/api/categories" && method === "GET") return json({ data: store });
    if (url === "/api/categories" && method === "POST") {
      const body = JSON.parse(String(init?.body));
      const created = makeCategory(body.name, body.description ?? "");
      store.push(created);
      return json({ data: created }, 201);
    }
    const match = /^\/api\/categories\/(.+)$/.exec(url);
    if (match && method === "PATCH") {
      const target = store.find((c) => c.id === match[1])!;
      Object.assign(target, JSON.parse(String(init?.body)));
      return json({ data: target });
    }
    if (match && method === "DELETE") {
      store = store.filter((c) => c.id !== match[1]);
      return new Response(null, { status: 204 });
    }
    return json({ error: { code: "NOT_FOUND", message: "nope" } }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function renderAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CategoriesAdmin />
    </QueryClientProvider>,
  );
}

const callsWith = (method: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === method);

describe("<CategoriesAdmin />", () => {
  it("lists the categories with their slug and description", async () => {
    renderAdmin();
    expect(await screen.findByText("Arrows")).toBeInTheDocument();
    expect(screen.getByText("arrows")).toBeInTheDocument();
    expect(screen.getByText("Direction icons")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    store = [];
    renderAdmin();
    expect(await screen.findByText(/no categories yet/i)).toBeInTheDocument();
  });

  it("creates a category and clears the form", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrows");

    await user.type(screen.getByLabelText("New category name"), "Weather");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByText("weather")).toBeInTheDocument();
    const [url, init] = callsWith("POST")[0] as [string, RequestInit];
    expect(url).toBe("/api/categories");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer good-key");
    expect(JSON.parse(String(init.body))).toEqual({ name: "Weather" });
    expect(screen.getByLabelText("New category name")).toHaveValue("");
  });

  it("shows the API error when creating fails", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrows");
    failNext = { status: 409, code: "CONFLICT", message: 'A category with the slug "arrows" already exists' };

    await user.type(screen.getByLabelText("New category name"), "Arrows");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
  });

  it("edits a category", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.click(await screen.findByRole("button", { name: "Edit Arrows" }));

    const name = screen.getByLabelText("Edit name");
    await user.clear(name);
    await user.type(name, "Direction Arrows");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Direction Arrows")).toBeInTheDocument();
    const [url, init] = callsWith("PATCH")[0] as [string, RequestInit];
    expect(url).toBe(`/api/categories/${store[0].id}`);
    expect(JSON.parse(String(init.body))).toMatchObject({ name: "Direction Arrows" });
  });

  it("asks for confirmation before deleting, then deletes", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.click(await screen.findByRole("button", { name: "Delete Arrows" }));
    expect(callsWith("DELETE")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(await screen.findByText(/no categories yet/i)).toBeInTheDocument();
    expect(callsWith("DELETE")).toHaveLength(1);
  });

  it("does not delete when cancelled", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.click(await screen.findByRole("button", { name: "Delete Arrows" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(callsWith("DELETE")).toHaveLength(0);
    expect(screen.getByText("Arrows")).toBeInTheDocument();
  });

  it("explains why a category with icons cannot be deleted", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.click(await screen.findByRole("button", { name: "Delete Arrows" }));
    failNext = {
      status: 409,
      code: "CONFLICT",
      message: "Category still has icons. Move or delete them first.",
    };
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/still has icons/i);
    expect(screen.getByText("Arrows")).toBeInTheDocument();
  });

  it("signs out when the server says the key is no longer valid", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrows");
    failNext = { status: 401, code: "UNAUTHORIZED", message: "Authentication required" };

    await user.type(screen.getByLabelText("New category name"), "Weather");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    await vi.waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});