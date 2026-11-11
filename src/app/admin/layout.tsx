import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminProvider } from "@/components/admin/admin-provider";

export const metadata: Metadata = {
  title: "Admin · InclineUI",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminGate>{children}</AdminGate>
    </AdminProvider>
  );
}