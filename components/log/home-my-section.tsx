"use client";

import { useEffect } from "react";
import { LAYOUT_HINTS, writeLayoutHint } from "@/lib/layout-hints";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import type { PlayLogSummary } from "@/hooks/use-play-logs";
import { daysBetween, localDateKey } from "@/lib/play-log";

/** Top of the home page for signed-in users: this month's plays and the unplayed shelf. */
export function HomeMySection({ logs, isLoading }: { logs: PlayLogSummary[]; isLoading: boolean }) {
  const todayKey = localDateKey(new Date());
  const monthKey = todayKey.slice(0, 7);
  const hasShelf = logs.some((l) => l.status === "unplayed");

  useEffect(() => {
    if (!isLoading) writeLayoutHint(LAYOUT_HINTS.homeShelf, hasShelf);
  }, [isLoading, hasShelf]);

  if (isLoading) {
    return (
      <section className="flex flex-col gap-4 pt-2">
        <div>
          <SkeletonText className="text-2xl font-bold leading-snug" barClassName="w-56" />
          <SkeletonText className="text-sm mt-1" barClassName="w-40" />
        </div>
        {/* Reserved only if the shelf showed last time (data-nazo-home-shelf on <html>). */}
        <div className="hidden [html[data-nazo-home-shelf]_&]:block">
          <ShelfSkeleton />
        </div>
      </section>
    );
  }

  const played = logs.filter((l) => l.status === "played");
  const thisMonth = played.filter((l) => l.dayKey.startsWith(monthKey)).length;
  const last = played.reduce<PlayLogSummary | undefined>((a, l) => (!a || l.dayKey > a.dayKey ? l : a), undefined);
  const lastAgo = last ? daysBetween(last.dayKey, todayKey) : 0;
  const unplayed = logs
    .filter((l) => l.status === "unplayed")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  return (
    <section className="flex flex-col gap-4 pt-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-snug text-balance">
          {thisMonth > 0 ? (
            <>이번 달 <span className="highlight">{thisMonth}개</span> 플레이했어요</>
          ) : (
            "이번 달 첫 나조를 기록해 보세요"
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {last ? (
            <>
              마지막 기록 ·{" "}
              <Link
                href={`/nazo/${last.nazo._id}`}
                className="font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
              >
                {last.nazo.originalTitle}
              </Link>{" "}
              ({lastAgo === 0 ? "오늘" : `${lastAgo}일 전`})
            </>
          ) : (
            "나조를 플레이하면 상세 화면에서 기록할 수 있어요."
          )}
        </p>
      </div>

      {unplayed.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">
                쌓아둔 나조 <span className="text-primary tabular-nums">{unplayed.length}</span>
              </h2>
              <p className="text-xs text-muted-foreground">사 두고 아직 안 한 나조 · 오래된 순</p>
            </div>
            <Link href="/my/unplayed" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              전체 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 scrollbar-hide">
            {unplayed.slice(0, 12).map((l) => (
              <Link key={l.nazoId} href={`/nazo/${l.nazo._id}`} className="w-[84px] shrink-0 flex flex-col gap-1">
                <span className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted border">
                  <Image src={l.nazo.imageUrl || `/api/image/${l.nazo._id}`} alt={l.nazo.originalTitle} fill sizes="84px" className="object-cover" />
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {daysBetween(localDateKey(new Date(l.createdAt)), todayKey)}일째
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** Mirrors the shelf card: header, then 84px poster tiles with a day count under each. */
function ShelfSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col gap-3">
      <div>
        <SkeletonText className="font-bold" barClassName="w-28" />
        <SkeletonText className="text-xs" barClassName="w-36" />
      </div>
      <div className="flex gap-3 overflow-hidden -mx-4 px-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-[84px] shrink-0 flex flex-col gap-1">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <SkeletonText className="text-[11px]" barClassName="w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
