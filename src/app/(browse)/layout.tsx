import type { ReactNode } from "react";
import { AppShell } from "@/components/browse/app-shell";

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}