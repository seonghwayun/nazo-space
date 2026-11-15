import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/**
 * Mirrors the nazo detail page (client-page.tsx) for the most common case:
 * one-line title, no description, one creator, no tags, no play log yet.
 * Static labels are rendered as real text so they line up exactly.
 */
export function NazoDetailSkeleton() {
  return (
    <div className="bg-background min-h-full relative">
      <div className="flex flex-col">
        {/* Hero */}
        <div className="relative w-full h-[45vh] md:h-[55vh] shrink-0 bg-muted animate-pulse overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full px-6 pt-12 pb-10 z-10">
            <SkeletonText className="text-3xl font-bold mb-1" barClassName="w-3/4 bg-white/30" />
          </div>
        </div>

        {/* Facts */}
        <div className="relative z-10 -mt-5 mx-4 grid grid-cols-3 rounded-2xl bg-card border shadow-sm divide-x">
          {["평균 별점", "난이도", "예상 시간"].map((label) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-2 py-3">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <SkeletonText className="text-sm font-bold w-full" barClassName="w-10 mx-auto block" />
            </div>
          ))}
        </div>

        <div className="h-4" />
        {/* My log card (no log yet) */}
        <div className="mx-4 rounded-2xl bg-card border shadow-sm p-4 flex flex-col gap-3">
          <span className="text-sm font-semibold text-muted-foreground">내 기록</span>
          <div>
            <SkeletonText className="text-sm" />
            <SkeletonText className="text-sm" barClassName="w-1/2" />
          </div>
          <Skeleton className="h-9 w-28" />
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
