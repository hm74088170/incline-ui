"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  label?: string;
  copiedLabel?: string;
  resetAfterMs?: number;
};

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  resetAfterMs = 2000,
}: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), resetAfterMs);
  }

  const Icon = status === "copied" ? Check : Copy;
  const text_ =
    status === "copied" ? copiedLabel : status === "failed" ? "Couldn't copy" : label;

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs text-subtle transition-colors hover:bg-hover hover:text-ink"
    >
      <Icon aria-hidden className="size-3.5" />
      <span aria-live="polite">{text_}</span>
    </button>
  );
}