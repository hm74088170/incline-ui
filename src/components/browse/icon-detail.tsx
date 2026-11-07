"use client";

import Link from "next/link";
import { useState } from "react";
import { useIcon } from "@/hooks/use-icon";
import { useRegistryIcon } from "@/hooks/use-registry-icon";
import { ApiError } from "@/lib/api/client";
import { CodeBlock } from "./code-block";
import { CopyButton } from "./copy-button";
import { PreviewControls } from "./preview-controls";
import { SvgPreview } from "./svg-preview";

type CodeTab = "react" | "svg";

const tabClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    active ? "bg-hover font-medium text-ink" : "text-subtle hover:text-ink"
  }`;

export function IconDetail({ slug }: { slug: string }) {
  const icon = useIcon(slug);
  const [size, setSize] = useState(64);
  const [color, setColor] = useState<string | undefined>();
  const [tab, setTab] = useState<CodeTab>("react");

  const premium = icon.data?.data.isPremium ?? false;
  const registry = useRegistryIcon(slug, icon.isSuccess && !premium);

  if (icon.isPending) {
    return (
      <div role="status" aria-label="Loading icon" className="mx-auto max-w-3xl animate-pulse space-y-6 p-6 md:p-10">
        <div className="h-8 w-48 rounded bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    );
  }

  if (icon.isError) {
    const missing =
      icon.error instanceof ApiError && (icon.error.status === 404 || icon.error.status === 400);
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">{missing ? "Icon not found" : "Could not load this icon"}</p>
        {missing ? (
          <Link href="/" className="text-sm text-subtle underline underline-offset-4 hover:text-ink">
            Back to icons
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => icon.refetch()}
            className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-hover"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const data = icon.data.data;
  const file = registry.data?.data.files[0];

  return (
    <article className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          {data.isPremium && (
            <span className="rounded-full border border-line px-2 py-0.5 text-xs text-subtle">Pro</span>
          )}
        </div>
        <p className="text-sm text-subtle">{data.category.name}</p>
        {data.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {data.tags.map((t) => (
              <li key={t} className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-subtle">
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      <section aria-label="Preview" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <div className="grid min-h-48 place-items-center rounded-xl bg-canvas">
          {data.svg ? (
            <SvgPreview svg={data.svg} name={data.name} size={size} color={color} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.url} alt={data.name} className="size-16 dark:invert" />
          )}
        </div>
        {data.svg && (
          <PreviewControls
            size={size}
            onSizeChange={setSize}
            color={color}
            onColorChange={setColor}
          />
        )}
      </section>

      {data.isPremium ? (
        <section
          aria-label="Premium icon"
          className="space-y-1 rounded-xl border border-line bg-surface p-5"
        >
          <p className="font-medium">This is a premium icon</p>
          <p className="text-sm text-subtle">
            The code and SVG are available with a subscription. Subscriptions are coming soon.
          </p>
        </section>
      ) : (
        <>
          <section aria-label="Install" className="space-y-2">
            <h2 className="text-sm font-medium">Install</h2>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <code className="min-w-0 truncate font-mono text-sm">
                {`npx inclineui add ${data.slug}`}
              </code>
              <CopyButton text={`npx inclineui add ${data.slug}`} label="Copy command" />
            </div>
          </section>

          <section aria-label="Code" className="space-y-3">
            <div role="tablist" aria-label="Code format" className="flex gap-1">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "react"}
                aria-controls="code-panel"
                onClick={() => setTab("react")}
                className={tabClass(tab === "react")}
              >
                React
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "svg"}
                aria-controls="code-panel"
                onClick={() => setTab("svg")}
                className={tabClass(tab === "svg")}
              >
                SVG
              </button>
            </div>

            <div role="tabpanel" id="code-panel">
              {tab === "svg" ? (
                data.svg && <CodeBlock title={`${data.slug}.svg`} code={data.svg} />
              ) : file ? (
                <CodeBlock title={file.path} code={file.content} />
              ) : registry.isError ? (
                <p className="text-sm text-subtle">Could not load the component code.</p>
              ) : (
                <p role="status" className="text-sm text-subtle">
                  Loading code…
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </article>
  );
}