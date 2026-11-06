"use client";

import Link from "next/link";
import type { IconListItem } from "@/lib/api/types";

type Props = {
  icons: IconListItem[];
  activeSlug?: string;
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
  onNavigate?: () => void;
};

const buttonClass =
  "w-full rounded-lg border border-line px-3 py-2 text-sm text-subtle transition-colors hover:bg-hover hover:text-ink disabled:opacity-60";

export function IconList({
  icons,
  activeSlug,
  isLoading,
  isError,
  hasMore,
  isLoadingMore,
  onRetry,
  onLoadMore,
  onNavigate,
}: Props) {
  if (isLoading) {
    return (
      <div role="status" aria-label="Loading icons" className="space-y-1 px-1">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 px-1.5 py-2">
            <div className="size-8 rounded-md bg-surface" />
            <div className="h-3 flex-1 rounded bg-surface" />
          </div>
        ))}
      </div>
    );
  }

  if (isError && icons.length === 0) {
    return (
      <div className="space-y-3 px-2 py-6 text-center text-sm">
        <p className="text-subtle">Could not load icons.</p>
        <button type="button" onClick={onRetry} className={buttonClass}>
          Try again
        </button>
      </div>
    );
  }

  if (icons.length === 0) {
    return <p className="px-2 py-6 text-center text-sm text-subtle">No icons found.</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-0.5">
        {icons.map((icon) => (
          <li key={icon.id}>
            <Link
              href={`/icons/${icon.slug}`}
              aria-current={icon.slug === activeSlug ? "page" : undefined}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-hover aria-[current=page]:bg-hover"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon.url}
                  alt=""
                  loading="lazy"
                  className="size-5 dark:invert"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{icon.name}</span>
                <span className="block truncate text-xs text-subtle">{icon.categoryName}</span>
              </span>
              {icon.isPremium && (
                <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-subtle">
                  Pro
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className={buttonClass}
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}