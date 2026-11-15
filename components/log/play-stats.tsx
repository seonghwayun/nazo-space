"use client";

import type { ReactNode } from "react";
import { formatDuration, type PlayStats as Stats } from "@/lib/play-log";
import { cn } from "@/lib/utils";

/** Rating histogram: ten 0.5-step bars, the most-given one highlighted. */
export function RateHistogram({ stats, height = "h-28", showCounts = true }: { stats: Stats; height?: string; showCounts?: boolean }) {
  const max = Math.max(1, ...stats.rateDistribution.map((d) => d.count));
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("grid grid-cols-10 items-end gap-1 border-b pt-4", height)}>
        {stats.rateDistribution.map((d) => (
          <div key={d.rate} className="relative flex h-full flex-col justify-end">
            {showCounts && d.count > 0 && (
              <span
                className="absolute inset-x-0 text-center text-[10px] tabular-nums text-muted-foreground"
                style={{ bottom: `calc(${(d.count / max) * 100}% + 2px)` }}
              >
                {d.count}
              </span>
            )}
            <span
              className={cn("rounded-t-sm", d.rate === stats.mostGivenRate ? "bg-star" : "bg-star/35")}
              style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-1 text-center text-[10px] tabular-nums text-muted-foreground">
        {stats.rateDistribution.map((d) => (
          <span key={d.rate}>{Number.isInteger(d.rate) ? d.rate : ""}</span>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span className="font-display text-xl tabular-nums leading-tight">{value}</span>
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/** 취향 분석: ratings, play time, plays per month and most-played creators. */
export function PlayStats({ stats }: { stats: Stats }) {
  if (stats.playedCount === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">플레이 기록이 쌓이면 취향을 분석해 드릴게요.</p>;
  }

  const monthMax = Math.max(1, ...stats.monthly.map((m) => m.count));
  const topMax = stats.topCreators[0]?.count ?? 1;
  const avgMinutes = stats.totalMinutes && stats.playedCount ? Math.round(stats.totalMinutes / stats.playedCount) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card title="별점 분포">
        {stats.ratedCount === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">아직 별점을 남긴 나조가 없어요.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 divide-x">
              <Figure value={stats.averageRate!.toFixed(1)} label="별점 평균" />
              <Figure value={String(stats.ratedCount)} label="별점 개수" />
              <Figure value={stats.mostGivenRate!.toFixed(1)} label="많이 준 별점" />
            </div>
            <RateHistogram stats={stats} />
          </>
        )}
      </Card>

      <Card title="플레이 시간">
        <div className="grid grid-cols-2 divide-x">
          <Figure value={stats.totalMinutes ? formatDuration(stats.totalMinutes) : "–"} label="총 플레이 시간" />
          <Figure value={avgMinutes ? formatDuration(avgMinutes) : "–"} label="한 편 평균" />
        </div>
        {stats.totalMinutes === 0 && (
          <p className="text-center text-xs text-muted-foreground">플레이 기록에 걸린 시간을 남기면 여기에 모여요.</p>
        )}
      </Card>

      <Card title="월별 플레이">
        <div
          className="grid h-32 items-end gap-2 border-b pt-5"
          style={{ gridTemplateColumns: `repeat(${stats.monthly.length}, minmax(0, 1fr))` }}
        >
          {stats.monthly.map((m, i) => (
            <div key={m.month} className="relative flex h-full flex-col justify-end">
              {m.count > 0 && (
                <span
                  className="absolute inset-x-0 text-center text-[11px] tabular-nums text-muted-foreground"
                  style={{ bottom: `calc(${(m.count / monthMax) * 100}% + 2px)` }}
                >
                  {m.count}
                </span>
              )}
              <span
                className={i === stats.monthly.length - 1 ? "rounded-t bg-stamp" : "rounded-t bg-primary"}
                style={{ height: `${(m.count / monthMax) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div
          className="grid gap-2 text-center text-[11px] text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${stats.monthly.length}, minmax(0, 1fr))` }}
        >
          {stats.monthly.map((m) => (
            <span key={m.month}>{Number(m.month.slice(5))}월</span>
          ))}
        </div>
      </Card>

      {stats.topCreators.length > 0 && (
        <Card title="많이 한 제작자">
          <ul className="flex flex-col gap-2.5">
            {stats.topCreators.map((c) => (
              <li key={c.name} className="grid grid-cols-[minmax(0,7.5rem)_1fr_1.5rem] items-center gap-3 text-sm">
                <span className="truncate font-medium">{c.name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.count / topMax) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums text-muted-foreground">{c.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
