"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { MySubPage } from "@/components/my/my-sub-page";
import { PosterGridSkeleton, RowListSkeleton } from "@/components/my/my-skeletons";
import { PlayedList, PLAYED_SORTS, parsePlayedSort, type PlayedSort } from "@/components/log/played-list";
import { Chip } from "@/components/ui/chip";
import { usePlayLogs } from "@/hooks/use-play-logs";

type Layout = "grid" | "list";

export default function MyPlayedPage() {
  return (
    <Suspense>
      <MyPlayedContent />
    </Suspense>
  );
}

function MyPlayedContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = parsePlayedSort(searchParams.get("sort"));
  const layout: Layout = searchParams.get("layout") === "list" ? "list" : "grid";
  const { logs, isLoading } = usePlayLogs();
  const playedCount = logs.filter((l) => l.status === "played").length;

  // Defaults (recent, grid) stay out of the URL; the rest survives back navigation.
  const update = (next: { sort?: PlayedSort; layout?: Layout }) => {
    const params = new URLSearchParams();
    const s = next.sort ?? sort;
    const l = next.layout ?? layout;
    if (s !== "recent") params.set("sort", s);
    if (l !== "grid") params.set("layout", l);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <MySubPage
      title={isLoading ? "플레이한 나조" : `플레이한 나조 ${playedCount}`}
      action={
        <button
          type="button"
          aria-label={layout === "grid" ? "목록으로 보기" : "포스터로 보기"}
          onClick={() => update({ layout: layout === "grid" ? "list" : "grid" })}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
        >
          {layout === "grid" ? <List className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide">
          {PLAYED_SORTS.map((s) => (
            <Chip key={s.key} active={sort === s.key} onClick={() => update({ sort: s.key })}>
              {s.label}
            </Chip>
          ))}
        </div>
        {isLoading ? (
          layout === "grid" ? <PosterGridSkeleton /> : <RowListSkeleton />
        ) : (
          <PlayedList logs={logs} sort={sort} layout={layout} />
        )}
      </div>
    </MySubPage>
  );
}
