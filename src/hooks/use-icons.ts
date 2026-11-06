import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchIcons } from "@/lib/api/icons";
import type { IconsQuery } from "@/lib/api/types";

export const iconKeys = {
  all: ["icons"] as const,
  list: (params: IconsQuery) => ["icons", "list", params] as const,
  infinite: (params: Omit<IconsQuery, "page">) => ["icons", "infinite", params] as const,
};

export function useIcons(params: IconsQuery = {}) {
  return useQuery({
    queryKey: iconKeys.list(params),
    queryFn: () => fetchIcons(params),
    // page/filter badalte waqt purana data dikhta rahe, grid flicker na kare
    placeholderData: keepPreviousData,
  });
}