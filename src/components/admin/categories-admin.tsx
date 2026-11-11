"use client";

import { useState, type FormEvent } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useCategoryMutations } from "@/hooks/use-category-mutations";
import type { Category } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-ink/40";
const buttonClass =
  "rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-hover disabled:opacity-50";

function CreateCategoryForm() {
  const { create } = useCategoryMutations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedDescription = description.trim();
    create.mutate(
      { name: name.trim(), ...(trimmedDescription ? { description: trimmedDescription } : {}) },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-medium">New category</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          aria-label="New category name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          aria-label="New category description"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>
            {create.error != null && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {getErrorMessage(create.error)}
        </p>
      )}
      <button type="submit" disabled={!name.trim() || create.isPending} className={buttonClass}>
        Add category
      </button>
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  // har row ki apni mutation state, taaki error sirf usi row me dikhe
  const { update, remove } = useCategoryMutations();
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);

  const error = update.error ?? remove.error;

  function save(e: FormEvent) {
    e.preventDefault();
    update.mutate(
      { id: category.id, input: { name: name.trim(), description: description.trim() } },
      { onSuccess: () => setMode("view") },
    );
  }

  return (
    <li className="space-y-2 rounded-xl border border-line p-4">
      {mode === "edit" ? (
        <form onSubmit={save} className="space-y-3">
          <input
            aria-label="Edit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            aria-label="Edit description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={!name.trim() || update.isPending} className={buttonClass}>
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setName(category.name);
                setDescription(category.description);
                update.reset();
                setMode("view");
              }}
              className={buttonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{category.name}</p>
            <p className="font-mono text-xs text-subtle">{category.slug}</p>
            {category.description && <p className="text-sm text-subtle">{category.description}</p>}
          </div>

          {mode === "confirm" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">Delete “{category.name}”?</span>
              <button
                type="button"
                onClick={() => remove.mutate(category.id, { onSettled: () => setMode("view") })}
                disabled={remove.isPending}
                className={`${buttonClass} border-red-500/50 text-red-600 dark:text-red-400`}
              >
                Confirm delete
              </button>
              <button type="button" onClick={() => setMode("view")} className={buttonClass}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={`Edit ${category.name}`}
                onClick={() => {
                  remove.reset();
                  setMode("edit");
                }}
                className={buttonClass}
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${category.name}`}
                onClick={() => {
                  update.reset();
                  setMode("confirm");
                }}
                className={buttonClass}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

            {error != null && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {getErrorMessage(error)}
        </p>
      )}
    </li>
  );
}

export function CategoriesAdmin() {
  const categories = useCategories();
  const items = categories.data?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>

      <CreateCategoryForm />

      {categories.isPending ? (
        <p role="status" className="text-sm text-subtle">
          Loading categories…
        </p>
      ) : categories.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Could not load categories.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-subtle">No categories yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </div>
  );
}