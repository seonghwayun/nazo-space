"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only stars with fractional fill (e.g. 3.5). `size` is the px size of one star. */
export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-px align-middle", className)} aria-label={`별점 ${value}`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-transparent fill-muted-foreground/20" style={{ width: size, height: size }} strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-transparent fill-star" style={{ width: size, height: size }} strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Star input in 0.5 steps. Each star is a 44px target split into a left (x.5)
 * and right (x.0) half, so it's easy to hit on a phone.
 */
export function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, v - (i - 1)));
          return (
            <span key={i} className="relative w-11 h-11 grid place-items-center">
              <span className="relative w-9 h-9 pointer-events-none">
                <Star className="absolute inset-0 w-9 h-9 text-transparent fill-muted-foreground/20" strokeWidth={0} />
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className="w-9 h-9 text-transparent fill-star" strokeWidth={0} />
                </span>
              </span>
              {[i - 0.5, i].map((score, half) => (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={v === score}
                  aria-label={`${score}점`}
                  onClick={() => onChange(score)}
                  className={cn(
                    "absolute inset-y-0 w-1/2 rounded-sm focus-visible:outline-2 focus-visible:outline-ring",
                    half === 0 ? "left-0" : "right-0"
                  )}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="font-display text-xl tabular-nums min-w-[2.2em]">{value ? value.toFixed(1) : "–"}</span>
      {value ? (
        <button type="button" className="text-xs text-muted-foreground underline underline-offset-2" onClick={() => onChange(null)}>
          지우기
        </button>
      ) : null}
    </div>
  );
}
