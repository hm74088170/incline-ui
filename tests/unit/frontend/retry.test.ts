import { ApiError } from "@/lib/api/client";
import { shouldRetry } from "@/lib/api/retry";

describe("shouldRetry", () => {
  it("does not retry client errors like 404 or 403", () => {
    expect(shouldRetry(0, new ApiError("nope", 404, "NOT_FOUND"))).toBe(false);
    expect(shouldRetry(0, new ApiError("no", 403, "FORBIDDEN"))).toBe(false);
  });

  it("retries server errors up to two times", () => {
    const err = new ApiError("boom", 500, "INTERNAL_ERROR");
    expect(shouldRetry(0, err)).toBe(true);
    expect(shouldRetry(1, err)).toBe(true);
    expect(shouldRetry(2, err)).toBe(false);
  });

  it("retries network errors", () => {
    expect(shouldRetry(0, new TypeError("Failed to fetch"))).toBe(true);
  });
});