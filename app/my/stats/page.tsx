"use client";

import { useMemo } from "react";
import { MySubPage } from "@/components/my/my-sub-page";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayStats } from "@/components/log/play-stats";
import { usePlayLogs } from "@/hooks/use-play-logs";
import { computeStats, localDateKey } from "@/lib/play-log";

export default function MyStatsPage() {
  const { logs, isLoading } = usePlayLogs();
  const stats = useMemo(() => computeStats(logs, localDateKey(new Date())), [logs]);
  return (
    <MySubPage wide title="취향 분석">
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <Skeleton className="h-[92px] rounded-2xl" />
          <Skeleton className="h-[236px] rounded-2xl" />
          <Skeleton className="h-[236px] rounded-2xl" />
        </div>
      ) : (
        <PlayStats stats={stats} />
      )}
    </MySubPage>
  );
}
