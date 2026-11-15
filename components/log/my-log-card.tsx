"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Lock, Pencil, Users, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { PlayedStamp } from "@/components/nazo/played-stamp";
import { daysBetween, formatDuration, localDateKey, type PlayStatus } from "@/lib/play-log";

export interface PlayLog {
  status: PlayStatus;
  playedAt: string | null;
  durationMinutes: number | null;
  companions: string;
  review: string;
  hasSpoiler: boolean;
  memo: string;
  rate: number | null;
  createdAt: string | null;
}

/** "내 기록" card on the nazo detail page. */
export function MyLogCard({
  nazoId,
  log,
  isSignedIn,
  onRequireLogin,
  onAddUnplayed,
  isBusy,
}: {
  nazoId: string;
  log: PlayLog | null;
  isSignedIn: boolean;
  onRequireLogin: () => void;
  onAddUnplayed: () => void;
  isBusy: boolean;
}) {
  const [memoOpen, setMemoOpen] = useState(false);

  if (!log || log.status === "unplayed") {
    const waiting = log?.createdAt ? daysBetween(localDateKey(new Date(log.createdAt)), localDateKey(new Date())) : null;
    return (
      <section className="mx-4 rounded-2xl bg-card border shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">내 기록</h2>
          {log && (
            <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold bg-marker/40 text-foreground">
              <Archive className="h-3 w-3" /> 쌓아둠
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {log
            ? waiting
              ? `${waiting}일째 쌓아두고 있어요. 플레이했다면 기록해 주세요.`
              : "쌓아둔 나조에 담겨 있어요. 플레이했다면 기록해 주세요."
            : "아직 기록이 없어요. 해봤다면 바로 기록하고, 아직이면 쌓아둘 수 있어요."}
        </p>
        {log?.memo && <MemoToggle memo={log.memo} open={memoOpen} onToggle={() => setMemoOpen(!memoOpen)} />}
        {!log && (
          <Button
            variant="outline"
            className="self-start"
            disabled={isBusy}
            onClick={() => (isSignedIn ? onAddUnplayed() : onRequireLogin())}
          >
            <Archive /> 쌓아두기
          </Button>
        )}
      </section>
    );
  }

  const facts = [
    log.playedAt && { icon: Calendar, text: log.playedAt.replace(/-/g, ".") },
    log.durationMinutes && { icon: Clock, text: formatDuration(log.durationMinutes) },
    log.companions && { icon: Users, text: log.companions },
  ].filter(Boolean) as { icon: typeof Calendar; text: string }[];

  return (
    <section className="relative mx-4 rounded-2xl bg-card border shadow-sm p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">내 기록</h2>
        <Link
          href={`/nazo/${nazoId}/review`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> 수정
        </Link>
      </div>
      <PlayedStamp size="lg" className="absolute right-4 top-11" />

      {facts.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 pr-24 text-sm">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">{text}</span>
            </li>
          ))}
        </ul>
      )}

      {log.rate ? (
        <div className="flex items-center gap-2">
          <Stars value={log.rate} size={20} />
          <span className="font-display text-base tabular-nums">{log.rate.toFixed(1)}</span>
        </div>
      ) : null}

      {log.review && (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap border-l-[3px] border-marker pl-3 line-clamp-6">
          {log.review}
        </p>
      )}

      {log.memo && <MemoToggle memo={log.memo} open={memoOpen} onToggle={() => setMemoOpen(!memoOpen)} />}

      {!log.rate && !log.review && facts.length === 0 && (
        <p className="text-sm text-muted-foreground">플레이했어요. 별점이나 리뷰를 남겨보세요.</p>
      )}
    </section>
  );
}

function MemoToggle({ memo, open, onToggle }: { memo: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex items-start gap-2 w-full rounded-lg bg-secondary px-3 py-2.5 text-left text-sm text-muted-foreground"
    >
      <Lock className="h-4 w-4 mt-0.5 shrink-0" />
      {open ? <span className="whitespace-pre-wrap text-foreground">{memo}</span> : <span>비공개 메모 · 탭해서 보기</span>}
    </button>
  );
}
