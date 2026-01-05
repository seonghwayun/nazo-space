import { Skeleton } from "@/components/ui/skeleton"

export function NazoPortraitCardSkeleton() {
  return (
    <div className="w-[160px] flex-none space-y-2">
      <div className="relative aspect-[2/3] w-full">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
      <div className="space-y-1.5 px-0.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}
