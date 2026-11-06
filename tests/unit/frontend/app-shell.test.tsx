import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/browse/app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/icons/arrow-left" }));

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

const icon = {
  id: "1",
  name: "Arrow Left",
  slug: "arrow-left",
  url: "https://cdn.test/a.svg",
  format: "svg",
  sizeBytes: 100,
  tags: [],
  isPremium: false,
  categoryId: "c1",
  categorySlug: "arrows",
  categoryName: "Arrows",
  createdAt: "2026-01-01T00:00:00Z",
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) =>
    url.startsWith("/api/categories")
      ? json({
          data: [
            { id: "c1", name: "Arrows", slug: "arrows", description: "", createdAt: "", updatedAt: "" },
          ],
        })
      : json({ data: [icon], meta: { total: 1, page: 1, limit: 48 } }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function renderShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AppShell>
        <p>Main content</p>
      </AppShell>
    </QueryClientProvider>,
  );
}

const calledWith = (text: string) =>
  fetchMock.mock.calls.some(([url]) => String(url).includes(text));

describe("<AppShell />", () => {
  it("renders the page content, the icons and the categories", async () => {
    renderShell();
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /arrow left/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Arrows" })).toBeInTheDocument();
  });

  it("marks the icon from the URL as active", async () => {
    renderShell();
    expect(await screen.findByRole("link", { name: /arrow left/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("searches the API after typing", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.type(screen.getByRole("searchbox", { name: /search icons/i }), "arrow");
    await waitFor(() => expect(calledWith("q=arrow")).toBe(true));
  });

  it("filters by category", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(await screen.findByRole("button", { name: "Arrows" }));
    await waitFor(() => expect(calledWith("category=arrows")).toBe(true));
  });
});

describe("<AppShell /> on mobile", () => {
  it("opens the drawer and closes it with Escape", async () => {
    const user = userEvent.setup();
    renderShell();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const open = screen.getByRole("button", { name: "Open sidebar" });
    expect(open).toHaveAttribute("aria-expanded", "false");

    await user.click(open);
    const dialog = screen.getByRole("dialog", { name: /icon browser/i });
    expect(within(dialog).getByRole("searchbox", { name: /search icons/i })).toBeInTheDocument();
    expect(open).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the overlay is clicked", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open sidebar" }));
    await user.click(screen.getByRole("button", { name: "Close sidebar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes after an icon is chosen", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open sidebar" }));
    const dialog = screen.getByRole("dialog");
    await user.click(await within(dialog).findByRole("link", { name: /arrow left/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});