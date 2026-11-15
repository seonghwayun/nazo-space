"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { PlayLogSummary } from "@/hooks/use-play-logs";
import { daysBetween, localDateKey } from "@/lib/play-log";
import { cn } from "@/lib/utils";

const STALE_DAYS = 90;

/** "쌓아둔 나조": nazos the user has but hasn't played, longest-waiting first. */
export function UnplayedList({ logs }: { logs: PlayLogSummary[] }) {
  const todayKey = localDateKey(new Date());
  const items = logs
    .filter((l) => l.status === "unplayed")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        쌓아둔 나조가 없어요.
        <br />
        나조 상세 화면에서 &lsquo;쌓아두기&rsquo;로 담을 수 있어요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">사 두거나 해보고 싶은 나조예요. 오래 기다린 순서로 보여줘요.</p>
      <ul className="flex flex-col divide-y">
        {items.map((log) => {
          const waiting = daysBetween(localDateKey(new Date(log.createdAt)), todayKey);
          return (
            <li key={log.nazoId} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3">
              <Link href={`/nazo/${log.nazo._id}`} className="relative aspect-[2/3] rounded overflow-hidden bg-muted" aria-label={log.nazo.originalTitle}>
                <Image src={log.nazo.imageUrl || `/api/image/${log.nazo._id}`} alt="" fill sizes="44px" className="object-cover" />
              </Link>
              <Link href={`/nazo/${log.nazo._id}`} className="min-w-0">
                <span className="block font-semibold leading-snug truncate">{log.nazo.originalTitle}</span>
                <span className="text-xs text-muted-foreground">
                  <span className={cn(waiting > STALE_DAYS && "text-stamp font-semibold")}>
                    {waiting === 0 ? "오늘 쌓아둠" : `${waiting}일째 쌓아둠`}
                  </span>
                  {log.nazo.estimatedTime && <> · {log.nazo.estimatedTime}</>}
                </span>
              </Link>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/nazo/${log.nazo._id}/review`}>기록</Link>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{STALE_DAYS}일 넘게 쌓아둔 나조는 빨간색으로 표시돼요.</p>
    </div>
  );
}
