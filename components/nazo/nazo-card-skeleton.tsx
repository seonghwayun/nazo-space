import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Mirrors NazoCard (most nazos have no translated title, so no subtitle line). */
export function NazoCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card shadow-sm h-full">
      <Skeleton className="shrink-0 w-20 h-20 rounded-md" />
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <SkeletonText className="text-lg leading-tight" barClassName="w-3/4" />
        <div className="flex flex-wrap gap-2 mt-2.5">
          {["w-[60px]", "w-[64px]", "w-[72px]"].map((w) => (
            <Skeleton key={w} className={cn("h-[26px] rounded-full", w)} />
          ))}
        </div>
      </div>
    </div>
  );
}
