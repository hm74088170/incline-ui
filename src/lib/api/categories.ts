import { apiFetch } from "./client";
import type { CategoriesResponse } from "./types";

export function fetchCategories(): Promise<CategoriesResponse> {
  return apiFetch<CategoriesResponse>("/api/categories");
}