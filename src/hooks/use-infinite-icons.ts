import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { fetchIcons } from "@/lib/api/icons";
import type { IconsQuery } from "@/lib/api/types";
import { iconKeys } from "./use-icons";

export function useInfiniteIcons(params: Omit<IconsQuery, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: iconKeys.infinite(params),
    queryFn: ({ pageParam }) => fetchIcons({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page * last.meta.limit < last.meta.total ? last.meta.page + 1 : undefined,
    // search/filter badalte waqt purani list dikhti rahe, flicker na ho
    placeholderData: keepPreviousData,
  });
}