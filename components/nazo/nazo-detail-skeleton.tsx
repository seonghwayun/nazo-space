import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/**
 * Mirrors the nazo detail page (client-page.tsx) for the most common case:
 * one-line title, no description, one creator, no tags.
 * Static labels are rendered as real text so they line up exactly.
 */
export function NazoDetailSkeleton() {
  return (
    <div className="bg-background min-h-full relative">
      <div className="flex flex-col">
        {/* Hero */}
        <div className="relative w-full h-[45vh] md:h-[55vh] shrink-0 bg-muted animate-pulse overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 pt-12 z-10">
            <SkeletonText className="text-3xl font-bold mb-2" barClassName="w-3/4 bg-white/30" />
            <SkeletonText className="text-sm mb-1" barClassName="w-4/5 bg-white/30" />
          </div>
        </div>

        {/* Rating + my review */}
        <div className="p-6 border-b border-border bg-background">
          <div className="flex flex-col gap-4">
            <div className="flex justify-center items-center py-1">
              <div className="flex items-center gap-4 px-6 py-1.5 border rounded-full shadow-sm">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded-full" />
                  ))}
                </div>
                <div className="w-px h-6 bg-border/50" />
                <span className="text-xl font-bold tabular-nums min-w-[1.8em] text-center tracking-tight">
                  <span className="text-muted-foreground/30 text-lg">-</span>
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-border/60" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground/80">내 리뷰</span>
                <div className="h-8 w-8" />
              </div>
              <SkeletonText className="text-sm" barClassName="w-2/3" />
            </div>
          </div>
        </div>

        {/* Description / creators */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">설명</h3>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">제작자</h3>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-[34px] w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
