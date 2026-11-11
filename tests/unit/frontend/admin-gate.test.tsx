import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminProvider } from "@/components/admin/admin-provider";
import { ADMIN_KEY_STORAGE } from "@/lib/admin/key-store";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const fetchMock = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
    new Headers(init?.headers).get("authorization") === "Bearer good-key"
      ? json({ data: { ok: true } })
      : json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401),
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const renderGate = () =>
  render(
    <AdminProvider>
      <AdminGate>
        <p>Secret area</p>
      </AdminGate>
    </AdminProvider>,
  );

const keyField = () => screen.findByLabelText(/admin key/i);

async function signIn(user: ReturnType<typeof userEvent.setup>, key: string) {
  await user.type(await keyField(), key);
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("<AdminGate />", () => {
  it("asks for the admin key when nobody is signed in", async () => {
    renderGate();
    expect(await keyField()).toBeInTheDocument();
    expect(screen.queryByText("Secret area")).not.toBeInTheDocument();
  });

  it("rejects a wrong key", async () => {
    const user = userEvent.setup();
    renderGate();
    await signIn(user, "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid admin key/i);
    expect(screen.queryByText("Secret area")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
  });

  it("signs in with the right key and remembers it for the tab", async () => {
    const user = userEvent.setup();
    renderGate();
    await signIn(user, "good-key");

    expect(await screen.findByText("Secret area")).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBe("good-key");
  });

  it("restores a saved session", async () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, "good-key");
    renderGate();
    expect(await screen.findByText("Secret area")).toBeInTheDocument();
  });

  it("drops a saved key that no longer works", async () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, "old-key");
    renderGate();
    expect(await keyField()).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
  });

  it("signs out", async () => {
    const user = userEvent.setup();
    renderGate();
    await signIn(user, "good-key");
    await user.click(await screen.findByRole("button", { name: /sign out/i }));

    expect(await keyField()).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
  });
});