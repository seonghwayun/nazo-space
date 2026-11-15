import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/** Placeholder for a grouped poster grid (played list, grid layout). */
export function PosterGridSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <SkeletonText className="text-sm" barClassName="w-28" />
      <div className="-mt-3 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <SkeletonText className="text-[13px] leading-tight" barClassName="w-4/5" />
            <SkeletonText className="-mt-1 text-[11px]" barClassName="w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder for rows with a small poster (played list rows, unplayed list). */
export function RowListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="flex flex-col divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="grid grid-cols-[40px_1fr] items-center gap-3 py-3">
          <Skeleton className="aspect-[2/3] rounded" />
          <span className="min-w-0">
            <SkeletonText className="font-semibold leading-snug" barClassName="w-3/4" />
            <SkeletonText className="text-xs" barClassName="w-1/3" />
          </span>
        </li>
      ))}
    </ul>
  );
}
