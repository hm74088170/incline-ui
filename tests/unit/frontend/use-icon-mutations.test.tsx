import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIconMutations } from "@/hooks/use-icon-mutations";
import { iconKeys } from "@/hooks/use-icons";
import { ApiError } from "@/lib/api/client";

const admin = vi.hoisted(() => ({ key: "good-key" as string | null, signOut: vi.fn() }));

vi.mock("@/components/admin/admin-provider", () => ({
  useAdmin: () => ({
    status: "authed",
    key: admin.key,
    signIn: vi.fn(),
    signOut: admin.signOut,
  }),
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  admin.key = "good-key";
  admin.signOut.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useIconMutations(), { wrapper });
  return { result: hook.result, invalidate };
}

const input = {
  file: new File(["<svg/>"], "arrow.svg", { type: "image/svg+xml" }),
  name: "Arrow",
  categoryId: "c1",
  tags: [],
};

describe("useIconMutations", () => {
  it("uploads with the admin key and refreshes the icon lists", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { slug: "arrow" } }), { status: 201 }),
    );
    const { result, invalidate } = setup();

    await act(() => result.current.upload.mutateAsync(input));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/icons");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer good-key");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: iconKeys.all });
  });

  it("deletes by slug and refreshes the icon lists", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { result, invalidate } = setup();

    await act(() => result.current.remove.mutateAsync("arrow"));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/icons/arrow");
    expect(init?.method).toBe("DELETE");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: iconKeys.all });
  });

  it("signs out when the server says the key is no longer valid", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "no" } }), {
        status: 401,
      }),
    );
    const { result } = setup();

    await act(async () => {
      await result.current.upload.mutateAsync(input).catch(() => {});
    });

    expect(admin.signOut).toHaveBeenCalledOnce();
  });

  it("does not call the server when there is no key", async () => {
    admin.key = null;
    const { result } = setup();

    let err: unknown;
    await act(async () => {
      err = await result.current.remove.mutateAsync("arrow").catch((e: unknown) => e);
    });

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});