import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { useCategories } from "@/hooks/use-categories";
import { useIcons } from "@/hooks/use-icons";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const respond = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("useIcons", () => {
  it("loads icons and meta", async () => {
    vi.stubGlobal(
      "fetch",
      respond({ data: [{ slug: "arrow-left" }], meta: { total: 1, page: 1, limit: 48 } }),
    );
    const { result } = renderHook(() => useIcons({ q: "arrow" }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].slug).toBe("arrow-left");
    expect(result.current.data?.meta.total).toBe(1);
  });

  it("exposes an ApiError when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      respond({ error: { code: "VALIDATION_ERROR", message: "Invalid input" } }, 400),
    );
    const { result } = renderHook(() => useIcons({ limit: 500 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
  });
});

describe("useCategories", () => {
  it("loads categories", async () => {
    vi.stubGlobal("fetch", respond({ data: [{ id: "1", slug: "arrows", name: "Arrows" }] }));
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].slug).toBe("arrows");
  });
});