import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/browse/app-shell";

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-canvas" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}