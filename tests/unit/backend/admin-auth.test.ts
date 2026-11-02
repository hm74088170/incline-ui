import { requireAdmin } from "@/server/auth/admin";
import { UnauthorizedError } from "@/lib/errors";

const reqWith = (authorization?: string) =>
  new Request("http://localhost/api/x", {
    headers: authorization ? { authorization } : {},
  });

  beforeEach(() => vi.stubEnv("ADMIN_API_KEY", "secret-key"));
afterEach(() => vi.unstubAllEnvs());

describe("requireAdmin", () => {
  it("allows a request with the correct bearer key", () => {
    expect(() => requireAdmin(reqWith("Bearer secret-key"))).not.toThrow();
  });

  it("rejects a missing header", () => {
    expect(() => requireAdmin(reqWith())).toThrow(UnauthorizedError);
  });

  it("rejects a wrong key", () => {
    expect(() => requireAdmin(reqWith("Bearer wrong"))).toThrow(UnauthorizedError);
  });

  it("rejects a header that is not a Bearer token", () => {
    expect(() => requireAdmin(reqWith("secret-key"))).toThrow(UnauthorizedError);
  });

  it("rejects everything when ADMIN_API_KEY is not configured", () => {
    vi.stubEnv("ADMIN_API_KEY", "");
    expect(() => requireAdmin(reqWith("Bearer "))).toThrow(UnauthorizedError);
  });
});