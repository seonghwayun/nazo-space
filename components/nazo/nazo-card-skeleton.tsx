import { Skeleton } from "@/components/ui/skeleton"

export function NazoCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card h-full">
      <Skeleton className="shrink-0 w-20 h-20 rounded-md" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>
    </div>
  )
}
