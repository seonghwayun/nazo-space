import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  );
}

/**
 * One line of placeholder text. Pass the same typography classes as the real
 * text (e.g. "text-lg leading-tight") so the line box has exactly the real
 * line height; the bar itself is drawn inside it.
 */
function SkeletonText({
  className,
  barClassName,
}: {
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("select-none", className)} aria-hidden>
      <Skeleton className={cn("inline-block h-[0.8em] w-full align-middle", barClassName)} />
    </div>
  );
}

export { Skeleton, SkeletonText };
