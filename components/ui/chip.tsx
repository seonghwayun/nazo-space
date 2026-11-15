"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pill toggle used for sort/filter rows. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors",
        active ? "bg-foreground text-background border-foreground font-semibold" : "bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
