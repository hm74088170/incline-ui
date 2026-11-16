"use client";

import { useState } from "react";
import { useIconMutations } from "@/hooks/use-icon-mutations";
import { useInfiniteIcons } from "@/hooks/use-infinite-icons";
import { getErrorMessage } from "@/lib/api/client";
import type { IconListItem } from "@/lib/api/types";

const PAGE_SIZE = 24;
const buttonClass =
  "rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-hover disabled:opacity-50";

function IconRow({ icon }: { icon: IconListItem }) {
  // har row ki apni mutation state, taaki error sirf usi row me dikhe
  const { remove } = useIconMutations();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="space-y-2 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Cloudinary ka bahari URL hai, admin thumbnail ke liye plain img kaafi hai */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon.url}
            alt=""
            className="size-10 shrink-0 rounded-lg border border-line bg-surface p-2"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="flex items-center gap-2 font-medium">
              {icon.name}
              {icon.isPremium && (
                <span className="rounded-full border border-line px-2 py-0.5 text-xs text-subtle">
                  Premium
                </span>
              )}
            </p>
            <p className="font-mono text-xs text-subtle">{icon.slug}</p>
            <p className="text-sm text-subtle">{icon.categoryName}</p>
          </div>
        </div>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">Delete “{icon.name}”?</span>
            <button
              type="button"
              onClick={() => remove.mutate(icon.slug, { onSettled: () => setConfirming(false) })}
              disabled={remove.isPending}
              className={`${buttonClass} border-red-500/50 text-red-600 dark:text-red-400`}
            >
              Confirm delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={buttonClass}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Delete ${icon.name}`}
            onClick={() => {
              remove.reset();
              setConfirming(true);
            }}
            className={buttonClass}
          >
            Delete
          </button>
        )}
      </div>

      {remove.error != null && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {getErrorMessage(remove.error)}
        </p>
      )}
    </li>
  );
}

export function IconsAdmin() {
  const icons = useInfiniteIcons({ limit: PAGE_SIZE });
  const items = icons.data?.pages.flatMap((page) => page.data) ?? [];
  const total = icons.data?.pages.at(-1)?.meta.total ?? 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">All icons ({total})</h2>

      {icons.isPending ? (
        <p role="status" className="text-sm text-subtle">
          Loading icons…
        </p>
      ) : icons.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Could not load icons.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-subtle">No icons yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((icon) => (
            <IconRow key={icon.id} icon={icon} />
          ))}
        </ul>
      )}

      {icons.hasNextPage && (
        <button
          type="button"
          onClick={() => icons.fetchNextPage()}
          disabled={icons.isFetchingNextPage}
          className={buttonClass}
        >
          {icons.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </section>
  );
}