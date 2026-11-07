import { ApiError } from "./client";

// 4xx errors (not found, forbidden) dobara try karne se theek nahi hote.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}