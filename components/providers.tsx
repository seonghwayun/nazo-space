"use client";

import { SessionProvider } from "next-auth/react";
import { SearchProvider } from "@/contexts/search-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SearchProvider>{children}</SearchProvider>
    </SessionProvider>
  );
}
