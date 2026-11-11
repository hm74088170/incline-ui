"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearAdminKey, readAdminKey, saveAdminKey } from "@/lib/admin/key-store";
import { verifyAdminKey } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

type Status = "loading" | "anonymous" | "authed";

type AdminContextValue = {
  status: Status;
  key: string | null;
  signIn: (key: string) => Promise<void>;
  signOut: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

async function restore(): Promise<{ status: Status; key: string | null }> {
  const stored = readAdminKey();
  if (!stored) return { status: "anonymous", key: null };
  try {
    await verifyAdminKey(stored);
    return { status: "authed", key: stored };
  } catch (err) {
    // key badal gayi (401): saved key hata do
    if (err instanceof ApiError && err.status === 401) clearAdminKey();
    return { status: "anonymous", key: null };
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    restore().then((result) => {
      if (cancelled) return;
      setKey(result.key);
      setStatus(result.status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (candidate: string) => {
    const trimmed = candidate.trim();
    await verifyAdminKey(trimmed); // galat key par ApiError(401) throw hota hai
    saveAdminKey(trimmed);
    setKey(trimmed);
    setStatus("authed");
  }, []);

  const signOut = useCallback(() => {
    clearAdminKey();
    setKey(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ status, key, signIn, signOut }), [status, key, signIn, signOut]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}