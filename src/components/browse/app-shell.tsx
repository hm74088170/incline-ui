"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";

function slugFromPath(pathname: string): string | undefined {
  const match = /^\/icons\/([^/]+)/.exec(pathname);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // search aur filter yahin rehte hain, taaki desktop sidebar aur mobile drawer same state dikhayein
  const sidebarProps = {
    query,
    onQueryChange: setQuery,
    category,
    onCategoryChange: setCategory,
    activeSlug: slugFromPath(pathname),
  };

  return (
    <div className="flex h-dvh bg-canvas text-ink">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-sidebar md:block">
        <Sidebar {...sidebarProps} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Icon browser"
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] border-r border-line bg-sidebar shadow-xl"
          >
            <Sidebar {...sidebarProps} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 md:hidden">
          <button
            type="button"
            aria-label="Open sidebar"
            aria-expanded={open}
            aria-controls="mobile-sidebar"
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg hover:bg-hover"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <span className="font-semibold">InclineUI</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}