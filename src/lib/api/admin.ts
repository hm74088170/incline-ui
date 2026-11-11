import { apiFetch } from "./client";
import type { Category } from "./types";

export type CategoryInput = { name: string; description?: string };
export type CategoryPatch = Partial<CategoryInput>;

const auth = (key: string): Record<string, string> => ({ Authorization: `Bearer ${key}` });
const jsonAuth = (key: string): Record<string, string> => ({
  ...auth(key),
  "Content-Type": "application/json",
});

export function verifyAdminKey(key: string) {
  return apiFetch<{ data: { ok: true } }>("/api/admin/session", { headers: auth(key) });
}

export function adminCreateCategory(key: string, input: CategoryInput) {
  return apiFetch<{ data: Category }>("/api/categories", {
    method: "POST",
    headers: jsonAuth(key),
    body: JSON.stringify(input),
  });
}

export function adminUpdateCategory(key: string, id: string, input: CategoryPatch) {
  return apiFetch<{ data: Category }>(`/api/categories/${id}`, {
    method: "PATCH",
    headers: jsonAuth(key),
    body: JSON.stringify(input),
  });
}

export function adminDeleteCategory(key: string, id: string) {
  return apiFetch<void>(`/api/categories/${id}`, { method: "DELETE", headers: auth(key) });
}