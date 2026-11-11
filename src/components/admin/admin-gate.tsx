"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { useAdmin } from "./admin-provider";

function LoginForm() {
  const { signIn } = useAdmin();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(value);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid admin key"
          : "Could not reach the server. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-4 text-ink">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6"
      >
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Admin access</h1>
          <p className="text-sm text-subtle">Enter the admin key to manage icons and categories.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="admin-key" className="text-sm font-medium">
            Admin key
          </label>
          <input
            id="admin-key"
            type="password"
            autoComplete="off"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-ink/40"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="h-10 w-full rounded-xl bg-ink text-sm font-medium text-canvas disabled:opacity-50"
        >
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { status, signOut } = useAdmin();

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-label="Checking access"
        className="grid min-h-dvh place-items-center text-sm text-subtle"
      >
        Checking access…
      </div>
    );
  }

  if (status === "anonymous") return <LoginForm />;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="flex h-14 items-center gap-4 border-b border-line px-4 md:px-6">
        <Link href="/admin/categories" className="font-semibold">
          InclineUI Admin
        </Link>
        <nav aria-label="Admin" className="flex gap-1 text-sm">
          <Link href="/admin/categories" className="rounded-md px-2.5 py-1.5 hover:bg-hover">
            Categories
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/" className="text-subtle hover:text-ink">
            View site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-line px-2.5 py-1 hover:bg-hover"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 md:p-8">{children}</main>
    </div>
  );
}
