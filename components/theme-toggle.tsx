"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "주간", icon: Sun },
  { value: "dark", label: "야간", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
];

/** 주간 / 야간 / 시스템 화면 모드 선택. */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-sm font-medium">화면 모드</span>
      <div role="radiogroup" aria-label="화면 모드" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={preference === value}
            onClick={() => setPreference(value)}
            className={cn(
              "flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors",
              preference === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
