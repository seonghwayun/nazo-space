import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function NazoPortraitCardSkeleton({ className, hideRating }: { className?: string, hideRating?: boolean }) {
  return (
    <div className={cn("w-[160px] flex-none space-y-2", className)}>
      <div className="relative aspect-[2/3] w-full">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
      <div className="space-y-1 px-0.5">
        <Skeleton className="h-5 w-3/4" />
        {!hideRating && <Skeleton className="h-5 w-12" />}
      </div>
    </div>
  )
}
