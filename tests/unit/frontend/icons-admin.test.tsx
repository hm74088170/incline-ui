import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IconsAdmin } from "@/components/admin/icons-admin";
import type { IconListItem } from "@/lib/api/types";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/components/admin/admin-provider", () => ({
  useAdmin: () => ({ status: "authed", key: "good-key", signIn: vi.fn(), signOut }),
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const makeIcon = (name: string, over: Partial<IconListItem> = {}): IconListItem => ({
  id: crypto.randomUUID(),
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  url: "https://cdn.test/icon.svg",
  format: "svg",
  sizeBytes: 100,
  tags: [],
  isPremium: false,
  categoryId: "c1",
  categorySlug: "arrows",
  categoryName: "Arrows",
  createdAt: "",
  ...over,
});

let store: IconListItem[];
let failNext: { status: number; code: string; message: string } | null;
let listFails: boolean;
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  store = [makeIcon("Arrow Up"), makeIcon("Arrow Down")];
  failNext = null;
  listFails = false;
  signOut.mockReset();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input, init) => {
    const method = init?.method ?? "GET";
    const url = new URL(String(input), "http://localhost");

    if (url.pathname === "/api/icons" && method === "GET") {
      if (listFails) return json({ error: { code: "INTERNAL", message: "boom" } }, 500);
      const page = Number(url.searchParams.get("page") ?? 1);
      const limit = Number(url.searchParams.get("limit") ?? 48);
      return json({
        data: store.slice((page - 1) * limit, page * limit),
        meta: { total: store.length, page, limit },
      });
    }

    const match = /^\/api\/icons\/(.+)$/.exec(url.pathname);
    if (match && method === "DELETE") {
      if (failNext) {
        const f = failNext;
        failNext = null;
        return json({ error: { code: f.code, message: f.message } }, f.status);
      }
      store = store.filter((i) => i.slug !== match[1]);
      return new Response(null, { status: 204 });
    }
    return json({ error: { code: "NOT_FOUND", message: "nope" } }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
});

function renderAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <IconsAdmin />
    </QueryClientProvider>,
  );
}

const deleteCalls = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE");

describe("<IconsAdmin />", () => {
  it("lists the icons with their slug and category", async () => {
    renderAdmin();
    expect(await screen.findByText("Arrow Up")).toBeInTheDocument();
    expect(screen.getByText("arrow-up")).toBeInTheDocument();
    expect(screen.getByText("Arrow Down")).toBeInTheDocument();
    expect(screen.getAllByText("Arrows")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: /all icons \(2\)/i })).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    store = [];
    renderAdmin();
    expect(await screen.findByText(/no icons yet/i)).toBeInTheDocument();
  });

  it("marks premium icons", async () => {
    store = [makeIcon("Arrow Up"), makeIcon("Crown", { isPremium: true })];
    renderAdmin();
    await screen.findByText("Crown");
    expect(screen.getAllByText("Premium")).toHaveLength(1);
  });

  it("shows an error when the list cannot be loaded", async () => {
    listFails = true;
    renderAdmin();
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not load icons/i);
  });

  it("asks for confirmation before deleting, then deletes", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrow Up");

    await user.click(screen.getByRole("button", { name: "Delete Arrow Up" }));
    expect(deleteCalls()).toHaveLength(0); // abhi sirf poochha hai
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(screen.queryByText("Arrow Up")).not.toBeInTheDocument());
    expect(screen.getByText("Arrow Down")).toBeInTheDocument();
    const [url, init] = deleteCalls()[0];
    expect(url).toBe("/api/icons/arrow-up");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer good-key");
  });

  it("does not delete when cancelled", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrow Up");

    await user.click(screen.getByRole("button", { name: "Delete Arrow Up" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deleteCalls()).toHaveLength(0);
    expect(screen.getByText("Arrow Up")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Arrow Up" })).toBeInTheDocument();
  });

  it("shows the server error in the row when delete fails", async () => {
    failNext = { status: 404, code: "NOT_FOUND", message: "Icon not found" };
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrow Up");

    await user.click(screen.getByRole("button", { name: "Delete Arrow Up" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/icon not found/i);
    expect(screen.getByText("Arrow Up")).toBeInTheDocument();
  });

  it("signs out when the server says the key is no longer valid", async () => {
    failNext = { status: 401, code: "UNAUTHORIZED", message: "Invalid admin key" };
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByText("Arrow Up");

    await user.click(screen.getByRole("button", { name: "Delete Arrow Up" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
  });

  it("loads more icons on demand", async () => {
    store = Array.from({ length: 30 }, (_, i) => makeIcon(`Icon ${i + 1}`));
    const user = userEvent.setup();
    renderAdmin();

    await screen.findByText("Icon 1");
    expect(screen.getAllByRole("listitem")).toHaveLength(24);

    await user.click(screen.getByRole("button", { name: /load more/i }));

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(30));
    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
  });
});