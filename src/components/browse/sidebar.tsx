"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/use-categories";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useInfiniteIcons } from "@/hooks/use-infinite-icons";
import { CategoryChips } from "./category-chips";
import { IconList } from "./icon-list";
import { SearchInput } from "./search-input";

export type SidebarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  category?: string;
  onCategoryChange: (slug: string | undefined) => void;
  activeSlug?: string;
  onNavigate?: () => void;
};

export function Sidebar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  activeSlug,
  onNavigate,
}: SidebarProps) {
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const categories = useCategories();
  const icons = useInfiniteIcons({ q: debouncedQuery || undefined, category });
  const items = icons.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[15px] font-semibold"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-ink text-sm text-canvas">
            I
          </span>
          InclineUI
        </Link>
        <SearchInput value={query} onChange={onQueryChange} />
        <CategoryChips
          categories={categories.data?.data ?? []}
          value={category}
          onChange={onCategoryChange}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <IconList
          icons={items}
          activeSlug={activeSlug}
          isLoading={icons.isPending}
          isError={icons.isError}
          hasMore={icons.hasNextPage}
          isLoadingMore={icons.isFetchingNextPage}
          onRetry={() => icons.refetch()}
          onLoadMore={() => icons.fetchNextPage()}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}