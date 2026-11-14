import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { deleteIcon, uploadIcon } from "@/lib/api/admin-icons";

afterEach(() => vi.unstubAllGlobals());

const stub = (res: Response) => {
  const fetchMock = vi.fn<typeof fetch>(async () => res);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("uploadIcon", () => {
  it("posts multipart form data with the admin key", async () => {
    const fetchMock = stub(
      new Response(JSON.stringify({ data: { slug: "arrow" } }), { status: 201 }),
    );
    const file = new File(["<svg/>"], "arrow.svg", { type: "image/svg+xml" });

    await uploadIcon("secret", {
      file,
      name: "Arrow",
      categoryId: "cat-1",
      tags: ["a", "b"],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/icons");
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer secret");
    // the browser must set the multipart boundary itself
    expect(headers.has("content-type")).toBe(false);

    const body = init?.body as FormData;
    expect(body.get("name")).toBe("Arrow");
    expect(body.get("categoryId")).toBe("cat-1");
    expect(body.get("tags")).toBe("a,b");
    expect((body.get("file") as File).name).toBe("arrow.svg");
  });

  it("throws an ApiError when the server rejects it", async () => {
    stub(
      new Response(
        JSON.stringify({ error: { code: "CONFLICT", message: "Icon already exists" } }),
        { status: 409 },
      ),
    );
    const file = new File(["<svg/>"], "arrow.svg");

    const err = await uploadIcon("k", {
      file,
      name: "Arrow",
      categoryId: "c",
      tags: [],
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, message: "Icon already exists" });
  });
});

describe("deleteIcon", () => {
  it("sends DELETE with the admin key", async () => {
    const fetchMock = stub(new Response(null, { status: 204 }));

    await deleteIcon("secret", "arrow-right");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/icons/arrow-right");
    expect(init?.method).toBe("DELETE");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer secret");
  });
});