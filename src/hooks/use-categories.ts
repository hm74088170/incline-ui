import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api/categories";

export const categoryKeys = {
  all: ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
    staleTime: 5 * 60_000, // categories kam badalti hain
  });
}