"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Stars } from "@/components/ui/stars";
import type { PlayLogSummary } from "@/hooks/use-play-logs";
import { formatDuration } from "@/lib/play-log";
import { cn } from "@/lib/utils";
import { POSTER_GRID, ROW_LIST } from "@/components/my/layout-classes";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function weekday(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function posterUrl(log: PlayLogSummary) {
  return log.nazo.imageUrl || `/api/image/${log.nazo._id}`;
}

export const PLAYED_SORTS = [
  { key: "recent", label: "최근 플레이 순" },
  { key: "high", label: "별점 높은 순" },
  { key: "low", label: "별점 낮은 순" },
] as const;
export type PlayedSort = (typeof PLAYED_SORTS)[number]["key"];

export function parsePlayedSort(value: string | null): PlayedSort {
  return PLAYED_SORTS.some((s) => s.key === value) ? (value as PlayedSort) : "recent";
}

const byRecent = (a: PlayLogSummary, b: PlayLogSummary) => (a.dayKey === b.dayKey ? 0 : a.dayKey < b.dayKey ? 1 : -1);

/**
 * One played nazo. "day" leads with the day of month (inside a month group);
 * "date" shows the full date under the title (inside a rating group).
 */
export function PlayedRow({ log, lead = "day" }: { log: PlayLogSummary; lead?: "day" | "date" }) {
  const date = log.dayKey.replace(/-/g, ".");
  return (
    <li>
      <Link
        href={`/nazo/${log.nazo._id}`}
        className={cn(
          "grid items-center gap-3 py-3",
          lead === "day" ? "grid-cols-[36px_40px_1fr]" : "grid-cols-[40px_1fr]"
        )}
      >
        {lead === "day" && (
          <span className="flex flex-col items-center leading-tight">
            <span className="font-display text-lg tabular-nums">{Number(log.dayKey.slice(8))}</span>
            <span className="text-[10px] text-muted-foreground">{weekday(log.dayKey)}</span>
          </span>
        )}
        <span className="relative aspect-[2/3] rounded overflow-hidden bg-muted">
          <Image src={posterUrl(log)} alt="" fill sizes="40px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-snug truncate">{log.nazo.originalTitle}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {lead === "day" && log.rate ? <Stars value={log.rate} size={12} /> : null}
            {lead === "date" && <span className="tabular-nums">{date}</span>}
            {log.durationMinutes ? <span>{formatDuration(log.durationMinutes)}</span> : null}
            {!log.playedAt && <span>기록한 날 기준</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Poster tile for the grid view: poster, title and my rating underneath. */
export function PlayedTile({ log }: { log: PlayLogSummary }) {
  return (
    <Link href={`/nazo/${log.nazo._id}`} className="group flex min-w-0 flex-col gap-1.5">
      <span className="relative aspect-[2/3] overflow-hidden rounded-lg border bg-muted">
        <Image
          src={posterUrl(log)}
          alt=""
          fill
          sizes="(min-width: 1024px) 150px, (min-width: 640px) 160px, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </span>
      <span className="truncate text-[13px] font-semibold leading-tight">{log.nazo.originalTitle}</span>
      <span className="-mt-1 text-[11px] tabular-nums text-muted-foreground">
        {log.rate ? <span className="text-star font-semibold">★ {log.rate.toFixed(1)}</span> : "별점 없음"}
      </span>
    </Link>
  );
}

/** Every played nazo: by month (newest first) or by rating, grouped; as a poster grid or rows. */
export function PlayedList({
  logs,
  sort = "recent",
  layout = "list",
}: {
  logs: PlayLogSummary[];
  sort?: PlayedSort;
  layout?: "grid" | "list";
}) {
  const played = logs.filter((l) => l.status === "played");

  if (played.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        아직 플레이 기록이 없어요.
        <br />
        나조 상세 화면에서 &lsquo;플레이 기록하기&rsquo;로 남길 수 있어요.
      </div>
    );
  }

  const rateOf = (l: PlayLogSummary) => (l.rate && l.rate > 0 ? l.rate : null);
  const sorted = [...played].sort((a, b) => {
    if (sort === "recent") return byRecent(a, b);
    const ra = rateOf(a), rb = rateOf(b);
    if (ra === null || rb === null) return ra === rb ? byRecent(a, b) : ra === null ? 1 : -1; // unrated last
    return (sort === "high" ? rb - ra : ra - rb) || byRecent(a, b);
  });

  const groups: { key: string; label: ReactNode; logs: PlayLogSummary[] }[] = [];
  for (const log of sorted) {
    const rate = rateOf(log);
    const key = sort === "recent" ? log.dayKey.slice(0, 7) : rate === null ? "none" : rate.toFixed(1);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.logs.push(log);
      continue;
    }
    const [y, m] = key.split("-").map(Number);
    const label =
      sort === "recent" ? (
        `${y}년 ${m}월`
      ) : rate === null ? (
        "별점 없음"
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Stars value={rate} size={14} />
          <span className="font-display tabular-nums">{key}</span>
        </span>
      );
    groups.push({ key, label, logs: [log] });
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            {g.label}
            <span className="font-normal text-muted-foreground">· {g.logs.length}개</span>
          </h3>
          {layout === "grid" ? (
            <div className={cn("mt-2", POSTER_GRID)}>
              {g.logs.map((log) => (
                <PlayedTile key={log.nazoId} log={log} />
              ))}
            </div>
          ) : (
            <ul className={ROW_LIST}>
              {g.logs.map((log) => (
                <PlayedRow key={log.nazoId} log={log} lead={sort === "recent" ? "day" : "date"} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
