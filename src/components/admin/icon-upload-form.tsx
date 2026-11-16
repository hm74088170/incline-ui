"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useIconMutations } from "@/hooks/use-icon-mutations";
import { getErrorMessage } from "@/lib/api/client";
import { validateSvgFile } from "@/lib/icon-file";

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-ink";
const labelClass = "text-sm text-subtle";

const nameFromFile = (fileName: string) =>
  fileName.replace(/\.svg$/i, "").replace(/[-_]+/g, " ").trim();

const parseTags = (value: string) =>
  value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

export function IconUploadForm() {
  const categories = useCategories();
  const { upload } = useIconMutations();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0); // file input ko khali karne ke liye

  function choose(next: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    setDone(null);
    upload.reset();

    if (!picked) {
      choose(null);
      setFileError(null);
      return;
    }
    const result = await validateSvgFile(picked);
    if (!result.ok) {
      choose(null);
      setFileError(result.error);
      return;
    }
    setFileError(null);
    choose(picked);
    if (!name) setName(nameFromFile(picked.name));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const trimmed = name.trim();
    try {
      await upload.mutateAsync({ file, name: trimmed, categoryId, tags: parseTags(tags) });
    } catch {
      return; // error upload.error se dikhta hai, form jaisa hai waisa rehta hai
    }
    setDone(`Uploaded ${trimmed}`);
    choose(null);
    setName("");
    setCategoryId("");
    setTags("");
    setInputKey((k) => k + 1);
  }

  const canSubmit = file !== null && name.trim() !== "" && categoryId !== "" && !upload.isPending;

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
      <div className="grid gap-1">
        <label htmlFor="icon-file" className={labelClass}>
          SVG file
        </label>
        <input
          key={inputKey}
          id="icon-file"
          type="file"
          accept=".svg,image/svg+xml"
          onChange={onFileChange}
          className="text-sm"
        />
        {fileError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {fileError}
          </p>
        )}
      </div>

      {previewUrl && file && (
        // blob URL hai, next/image yahan kaam nahi karta
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={`Preview of ${file.name}`}
          className="size-24 rounded-xl border border-line bg-surface p-3"
        />
      )}

      <div className="grid gap-1">
        <label htmlFor="icon-name" className={labelClass}>
          Name
        </label>
        <input
          id="icon-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="icon-category" className={labelClass}>
          Category
        </label>
        <select
          id="icon-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">Choose a category</option>
          {categories.data?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <label htmlFor="icon-tags" className={labelClass}>
          Tags
        </label>
        <input
          id="icon-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="arrow, direction"
          className={inputClass}
        />
      </div>

      {upload.error != null && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {getErrorMessage(upload.error)}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-green-600 dark:text-green-400">
          {done}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-10 rounded-xl bg-ink px-4 text-sm font-medium text-canvas disabled:opacity-50"
      >
        {upload.isPending ? "Uploading…" : "Upload icon"}
      </button>
    </form>
  );
}