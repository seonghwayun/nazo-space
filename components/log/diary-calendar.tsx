"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlayedRow, posterUrl } from "@/components/log/played-list";
import type { PlayLogSummary } from "@/hooks/use-play-logs";
import { groupByDay, localDateKey, monthGrid, shiftMonth } from "@/lib/play-log";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** Month calendar filled with the posters of nazos played that day, optionally followed by that month's list. */
export function DiaryCalendar({ logs, showList = true }: { logs: PlayLogSummary[]; showList?: boolean }) {
  const todayKey = localDateKey(new Date());
  const thisMonth = todayKey.slice(0, 7);
  const [monthKey, setMonthKey] = useState(thisMonth);

  // Only logs with a play date go on the calendar; without one, dayKey falls back to
  // the day the record was made, which is not when the user played it.
  const datedLogs = useMemo(() => logs.filter((l) => l.playedAt), [logs]);
  const byDay = useMemo(() => groupByDay(datedLogs, monthKey), [datedLogs, monthKey]);
  const monthLogs = useMemo(
    () => datedLogs.filter((l) => l.status === "played" && l.dayKey.startsWith(monthKey)),
    [datedLogs, monthKey]
  );
  const [y, m] = monthKey.split("-").map(Number);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setMonthKey(shiftMonth(monthKey, -1))}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-bold">
          {y}년 {m}월 <span className="text-sm font-normal text-muted-foreground">· {monthLogs.length}개</span>
        </span>
        <button
          type="button"
          aria-label="다음 달"
          disabled={monthKey >= thisMonth}
          onClick={() => setMonthKey(shiftMonth(monthKey, 1))}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-secondary disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 w-full">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-[11px] text-muted-foreground pb-1">{w}</span>
        ))}
        {monthGrid(monthKey).map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;
          const entries = byDay.get(day);
          const isToday = `${monthKey}-${String(day).padStart(2, "0")}` === todayKey;
          if (!entries) {
            return (
              <span
                key={day}
                className={cn(
                  "aspect-square rounded-md bg-card border border-border/60 p-1 text-[11px] tabular-nums text-muted-foreground",
                  isToday && "border-primary text-primary font-semibold"
                )}
              >
                {day}
              </span>
            );
          }
          const first = entries[0];
          return (
            <Link
              key={day}
              href={`/nazo/${first.nazo._id}`}
              aria-label={`${m}월 ${day}일 ${entries.map((e) => e.nazo.originalTitle).join(", ")}`}
              className="relative aspect-square rounded-md overflow-hidden bg-muted"
            >
              <Image src={posterUrl(first)} alt="" fill sizes="(min-width: 672px) 92px, 14vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
              <span className="absolute top-0.5 left-1 text-[11px] font-semibold text-white tabular-nums">{day}</span>
              {entries.length > 1 && (
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">
                  +{entries.length - 1}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {!showList ? null : monthLogs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">이 달에는 플레이 기록이 없어요.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {monthLogs.map((log) => (
            <PlayedRow key={log.nazoId} log={log} />
          ))}
        </ul>
      )}
    </div>
  );
}
