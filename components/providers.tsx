"use client";

import { SessionProvider } from "next-auth/react";
import { SearchProvider } from "@/contexts/search-context";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SearchProvider>
        <ToastProvider>{children}</ToastProvider>
      </SearchProvider>
    </SessionProvider>
  );
}
