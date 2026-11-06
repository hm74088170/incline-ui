import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useInfiniteIcons } from "@/hooks/use-infinite-icons";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => vi.unstubAllGlobals());

describe("useInfiniteIcons", () => {
  it("loads page by page until everything is fetched", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page") ?? 1);
      return new Response(
        JSON.stringify({ data: [{ slug: `icon-${page}` }], meta: { total: 2, page, limit: 1 } }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useInfiniteIcons({ q: "arrow" }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toContain("q=arrow");

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });
});