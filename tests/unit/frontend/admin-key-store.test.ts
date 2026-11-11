import {
  ADMIN_KEY_STORAGE,
  clearAdminKey,
  readAdminKey,
  saveAdminKey,
} from "@/lib/admin/key-store";

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("admin key store", () => {
  it("saves, reads and clears the key", () => {
    expect(readAdminKey()).toBeNull();
    saveAdminKey("abc");
    expect(readAdminKey()).toBe("abc");
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBe("abc");
    clearAdminKey();
    expect(readAdminKey()).toBeNull();
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readAdminKey()).toBeNull();
    expect(() => saveAdminKey("abc")).not.toThrow();
  });
});