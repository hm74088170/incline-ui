"use client";

import type { Category } from "@/lib/api/types";

type Props = {
  categories: Pick<Category, "slug" | "name">[];
  value?: string;
  onChange: (slug: string | undefined) => void;
};

const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
    active
      ? "border-ink bg-ink text-canvas"
      : "border-line text-subtle hover:bg-hover hover:text-ink"
  }`;

export function CategoryChips({ categories, value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
    >
      <button
        type="button"
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
        className={chip(value === undefined)}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.slug}
          type="button"
          aria-pressed={value === c.slug}
          onClick={() => onChange(c.slug)}
          className={chip(value === c.slug)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}