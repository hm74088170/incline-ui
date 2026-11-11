import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/server/auth/admin";

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    return Response.json({ data: { ok: true } });
  } catch (err) {
    return errorResponse(err);
  }
}