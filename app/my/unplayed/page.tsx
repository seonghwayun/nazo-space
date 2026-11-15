"use client";

import { MySubPage } from "@/components/my/my-sub-page";
import { RowListSkeleton } from "@/components/my/my-skeletons";
import { UnplayedList } from "@/components/log/unplayed-list";
import { usePlayLogs } from "@/hooks/use-play-logs";

export default function MyUnplayedPage() {
  const { logs, isLoading } = usePlayLogs();
  const count = logs.filter((l) => l.status === "unplayed").length;
  return (
    <MySubPage title={isLoading ? "쌓아둔 나조" : `쌓아둔 나조 ${count}`}>
      {isLoading ? <RowListSkeleton /> : <UnplayedList logs={logs} />}
    </MySubPage>
  );
}
