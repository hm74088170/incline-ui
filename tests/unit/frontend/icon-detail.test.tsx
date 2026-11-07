import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconDetail } from "@/components/browse/icon-detail";

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

const category = {
  id: "c1", name: "Arrows", slug: "arrows", description: "", createdAt: "", updatedAt: "",
};

const detail = (overrides: Record<string, unknown> = {}) => ({
  data: {
    id: "1", name: "Arrow Left", slug: "arrow-left", url: "https://cdn.test/a.svg",
    svg: SVG, format: "svg", sizeBytes: 120, tags: ["direction", "back"],
    isPremium: false, createdAt: "", updatedAt: "", category, ...overrides,
  },
});

const registry = {
  data: {
    name: "arrow-left", title: "Arrow Left", type: "registry:icon", category: "arrows",
    tags: [], componentName: "ArrowLeft", dependencies: [],
    files: [{ path: "icons/arrow-left.tsx", content: "export function ArrowLeft() {}" }],
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const fetchMock = vi.fn();
let detailResponse: () => Response;

beforeEach(() => {
  detailResponse = () => json(detail());
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    if (url === "/api/icons/arrow-left") return detailResponse();
    if (url === "/api/registry/icons/arrow-left") return json(registry);
    return json({ error: { code: "NOT_FOUND", message: "Icon not found" } }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function renderDetail(slug = "arrow-left") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <IconDetail slug={slug} />
    </QueryClientProvider>,
  );
}

describe("<IconDetail />", () => {
  it("shows a loading state first", () => {
    renderDetail();
    expect(screen.getByRole("status", { name: /loading icon/i })).toBeInTheDocument();
  });

  it("shows the name, category and tags", async () => {
    renderDetail();
    expect(await screen.findByRole("heading", { level: 1, name: "Arrow Left" })).toBeInTheDocument();
    expect(screen.getByText("Arrows")).toBeInTheDocument();
    expect(screen.getByText("direction")).toBeInTheDocument();
    expect(screen.getByText("back")).toBeInTheDocument();
  });

  it("shows the preview and the install command", async () => {
    renderDetail();
    expect(await screen.findByRole("img", { name: "Arrow Left" })).toBeInTheDocument();
    expect(screen.getByText("npx inclineui add arrow-left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy command" })).toBeInTheDocument();
  });

  it("changes the preview size with the slider", async () => {
    renderDetail();
    const preview = await screen.findByRole("img", { name: "Arrow Left" });
    fireEvent.change(screen.getByRole("slider", { name: "Size" }), { target: { value: "96" } });
    expect(preview).toHaveStyle({ width: "96px", height: "96px" });
  });

  it("shows the React component code and switches to the SVG tab", async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(await screen.findByText("icons/arrow-left.tsx")).toBeInTheDocument();
    expect(screen.getByText("export function ArrowLeft() {}")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "SVG" }));
    expect(screen.getByText("arrow-left.svg")).toBeInTheDocument();
    expect(screen.queryByText("icons/arrow-left.tsx")).not.toBeInTheDocument();
  });

  it("locks premium icons and never asks for their code", async () => {
    detailResponse = () => json(detail({ isPremium: true, svg: null }));
    renderDetail();

    expect(await screen.findByRole("region", { name: /premium icon/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/registry"))).toBe(false);
  });

  it("shows a not-found message for an unknown icon", async () => {
    renderDetail("nope");
    expect(await screen.findByText(/icon not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to icons/i })).toHaveAttribute("href", "/");
  });
});