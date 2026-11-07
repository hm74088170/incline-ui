"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { shouldRetry } from "@/lib/api/retry";


export function Providers({ children }: { children: ReactNode }) {
  // useState ke andar banao, taaki har render par naya client na bane
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: shouldRetry },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}