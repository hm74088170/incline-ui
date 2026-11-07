import { apiFetch } from "./client";
import type { RegistryItem } from "./types";

export function fetchRegistryIcon(slug: string): Promise<{ data: RegistryItem }> {
  return apiFetch<{ data: RegistryItem }>(`/api/registry/icons/${encodeURIComponent(slug)}`);
}