import { createHash, timingSafeEqual } from "node:crypto";
import { UnauthorizedError } from "@/lib/errors";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export function requireAdmin(req: Request): void {
  const expected = process.env.ADMIN_API_KEY;
  // key set nahi hai to sab band (fail closed)
  if (!expected) throw new UnauthorizedError();

   const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw new UnauthorizedError();

  // hash karke compare: length leak nahi hoti aur timing attack nahi chalta
  if (!timingSafeEqual(sha256(token), sha256(expected))) {
    throw new UnauthorizedError();
  }
}