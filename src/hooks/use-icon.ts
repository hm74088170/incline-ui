import { useQuery } from "@tanstack/react-query";
import { fetchIcon } from "@/lib/api/icons";
import { iconKeys } from "./use-icons";

export function useIcon(slug: string) {
  return useQuery({ queryKey: iconKeys.detail(slug), queryFn: () => fetchIcon(slug) });
}