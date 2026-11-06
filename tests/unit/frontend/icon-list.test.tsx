import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconList } from "@/components/browse/icon-list";
import type { IconListItem } from "@/lib/api/types";

const make = (overrides: Partial<IconListItem> = {}): IconListItem => ({
  id: "1",
  name: "Arrow Left",
  slug: "arrow-left",
  url: "https://cdn.test/a.svg",
  format: "svg",
  sizeBytes: 120,
  tags: [],
  isPremium: false,
  categoryId: "c1",
  categorySlug: "arrows",
  categoryName: "Arrows",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const props = () => ({
  icons: [make()],
  isLoading: false,
  isError: false,
  hasMore: false,
  isLoadingMore: false,
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
});

describe("<IconList />", () => {
  it("links each icon to its page and shows its category", () => {
    render(<IconList {...props()} />);
    const link = screen.getByRole("link", { name: /arrow left/i });
    expect(link).toHaveAttribute("href", "/icons/arrow-left");
    expect(screen.getByText("Arrows")).toBeInTheDocument();
  });

  it("marks the active icon", () => {
    render(<IconList {...props()} activeSlug="arrow-left" />);
    expect(screen.getByRole("link", { name: /arrow left/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows a Pro badge on premium icons only", () => {
    render(
      <IconList
        {...props()}
        icons={[make(), make({ id: "2", name: "Crown", slug: "crown", isPremium: true })]}
      />,
    );
    expect(screen.getAllByText("Pro")).toHaveLength(1);
  });

  it("calls onNavigate when an icon is chosen", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<IconList {...props()} onNavigate={onNavigate} />);
    await user.click(screen.getByRole("link", { name: /arrow left/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state instead of the list", () => {
    render(<IconList {...props()} icons={[]} isLoading />);
    expect(screen.getByRole("status", { name: /loading icons/i })).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows an error with a retry button", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<IconList {...p} icons={[]} isError />);
    expect(screen.getByText(/could not load icons/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(p.onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state", () => {
    render(<IconList {...props()} icons={[]} />);
    expect(screen.getByText(/no icons found/i)).toBeInTheDocument();
  });

  it("offers Load more only when there is more", async () => {
    const user = userEvent.setup();
    const p = props();
    const { rerender } = render(<IconList {...p} />);
    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();

    rerender(<IconList {...p} hasMore />);
    await user.click(screen.getByRole("button", { name: /load more/i }));
    expect(p.onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("disables the button while the next page is loading", () => {
    render(<IconList {...props()} hasMore isLoadingMore />);
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
  });
});