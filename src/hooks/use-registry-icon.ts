import { useQuery } from "@tanstack/react-query";
import { fetchRegistryIcon } from "@/lib/api/registry";

export function useRegistryIcon(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["registry", "icon", slug],
    queryFn: () => fetchRegistryIcon(slug),
    enabled,
  });
}
