import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-background min-h-full">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[45vh] md:h-[55vh] shrink-0 bg-muted animate-pulse">
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 pt-12 z-10 space-y-3">
          <Skeleton className="h-10 w-3/4 bg-white/20" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 bg-white/20" />
            <Skeleton className="h-5 w-20 bg-white/20" />
            <Skeleton className="h-5 w-20 bg-white/20" />
          </div>
          <Skeleton className="h-4 w-1/2 bg-white/20" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-6">
        <div className="flex justify-center py-2 gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-10 h-10 rounded-sm" />)}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
