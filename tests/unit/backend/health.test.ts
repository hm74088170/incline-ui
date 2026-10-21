
import {GET} from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns status ok with HTTP 200", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});