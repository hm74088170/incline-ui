import { fetchIcon } from "@/lib/api/icons";
import { fetchRegistryIcon } from "@/lib/api/registry";

afterEach(() => vi.unstubAllGlobals());

const stub = () => {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify({ data: {} }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("fetchIcon", () => {
  it("calls the icon detail endpoint", async () => {
    const fetchMock = stub();
    await fetchIcon("arrow-left");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/icons/arrow-left");
  });

  it("encodes the slug", async () => {
    const fetchMock = stub();
    await fetchIcon("a/b");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/icons/a%2Fb");
  });
});

describe("fetchRegistryIcon", () => {
  it("calls the registry endpoint", async () => {
    const fetchMock = stub();
    await fetchRegistryIcon("arrow-left");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/registry/icons/arrow-left");
  });
});