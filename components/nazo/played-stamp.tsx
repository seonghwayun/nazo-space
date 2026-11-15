import { cn } from "@/lib/utils";

/** Red hanko-style "PLAYED" stamp shown on nazos the user has played. */
export function PlayedStamp({ size = "sm", className }: { size?: "xs" | "sm" | "lg"; className?: string }) {
  return (
    <span
      aria-label="플레이함"
      className={cn(
        "inline-block font-display tracking-wider text-stamp bg-card/90 border-stamp -rotate-[11deg] select-none leading-none",
        size === "xs" && "text-[7px] px-[3px] py-[2px] border rounded-[3px]",
        size === "sm" && "text-[10px] px-1.5 py-[3px] border-2 rounded-[5px]",
        size === "lg" && "text-lg px-2.5 py-1 border-[3px] rounded-lg",
        className
      )}
    >
      PLAYED
    </span>
  );
}
