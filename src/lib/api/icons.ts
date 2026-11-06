import { apiFetch } from "./client";
import type { IconsQuery, ListIconsResponse } from "./types";

export function buildIconsQuery(params: IconsQuery = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function fetchIcons(params: IconsQuery = {}): Promise<ListIconsResponse> {
  return apiFetch<ListIconsResponse>(`/api/icons${buildIconsQuery(params)}`);
}