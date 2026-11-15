"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Check, ChevronRight, Pencil, Settings, X } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlayedTile } from "@/components/log/played-list";
import { DiaryCalendar } from "@/components/log/diary-calendar";
import { RateHistogram } from "@/components/log/play-stats";
import { usePlayLogs } from "@/hooks/use-play-logs";
import { computeStats, localDateKey } from "@/lib/play-log";

export default function MyPage() {
  const { data: session, status } = useSession();
  const { logs, isLoading: isLogsLoading } = usePlayLogs();
  const todayKey = localDateKey(new Date());
  const stats = useMemo(() => computeStats(logs, todayKey), [logs, todayKey]);
  const recent = useMemo(
    () =>
      logs
        .filter((l) => l.status === "played")
        .sort((a, b) => (a.dayKey === b.dayKey ? 0 : a.dayKey < b.dayKey ? 1 : -1))
        .slice(0, 10),
    [logs]
  );

  const [userProfile, setUserProfile] = useState<{ nickname?: string } | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
          setNicknameInput(data.nickname || session.user?.name || "");
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    })();
  }, [session]);

  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) return;
    setIsSavingNickname(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nicknameInput }),
      });
      if (res.ok) {
        setUserProfile(await res.json());
        setIsEditingNickname(false);
      }
    } catch (error) {
      console.error("Failed to save nickname", error);
    } finally {
      setIsSavingNickname(false);
    }
  };

  if (status === "loading") return <MyHubSkeleton />;

  if (!session) {
    return (
      <MainLayout fullWidth className="flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-in fade-in zoom-in duration-500">
          <div className="relative w-28 h-28 mb-8 drop-shadow-xl">
            <Image
              src="/icon.png"
              alt="Nazo Space Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-center bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Nazo Space
          </h1>

          <p className="text-muted-foreground text-center max-w-sm mb-12 text-base sm:text-lg leading-relaxed">
            나조를 기록하고 공유하는 당신만의 공간,<br />
            미스터리한 여정을 지금 시작하세요.
          </p>

          <Button
            variant="outline"
            size="lg"
            onClick={() => signIn("google")}
            className="w-full max-w-[320px] h-14 gap-3 text-base font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:shadow-md transition-all rounded-full dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <GoogleIcon className="w-5 h-5" />
            Google로 계속하기
          </Button>

          <p className="mt-8 text-xs text-muted-foreground/60 text-center">
            로그인 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>

          <ThemeToggle className="mt-10 w-full max-w-[320px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout padded>
      <div className="mx-auto flex max-w-2xl lg:max-w-screen-xl flex-col gap-5">
        <div className="flex items-center gap-4">
          {session.user?.image ? (
            <Image src={session.user.image} alt="" width={64} height={64} className="rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <span className="text-2xl font-bold">{session.user?.name?.[0] || "U"}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <Input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} className="h-8 w-40" maxLength={20} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" aria-label="저장" onClick={handleSaveNickname} disabled={isSavingNickname}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" aria-label="취소" onClick={() => setIsEditingNickname(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="truncate text-xl font-bold">{userProfile?.nickname ?? "\u00a0"}</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="닉네임 수정"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  onClick={() => {
                    setNicknameInput(userProfile?.nickname || "");
                    setIsEditingNickname(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">나조 플레이 기록</p>
          </div>
          <Link href="/my/settings" aria-label="설정" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-secondary">
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        {isLogsLoading ? (
          <HubBodySkeleton />
        ) : (
          <>
            <div className="grid grid-cols-3 divide-x rounded-2xl border bg-card py-3 shadow-sm">
              <CountLink href="/my/played" value={stats.playedCount} label="플레이" />
              <CountLink href="/my/played?sort=high" value={stats.ratedCount} label="별점" />
              <CountLink href="/my/unplayed" value={stats.unplayedCount} label="쌓아둠" />
            </div>

            <section className="flex flex-col gap-3">
              <SectionHeader title="최근 플레이" href={recent.length ? "/my/played" : undefined} />
              {recent.length === 0 ? (
                <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  나조 상세 화면에서 &lsquo;플레이 기록하기&rsquo;로 첫 기록을 남겨보세요.
                </p>
              ) : (
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                  {recent.map((log) => (
                    <div key={log.nazoId} className="w-[96px] shrink-0">
                      <PlayedTile log={log} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              <HubCard href="/my/stats" title="취향 분석">
                {stats.ratedCount > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      평균 <span className="font-semibold text-star">★ {stats.averageRate!.toFixed(1)}</span> · 가장 많이 준 별점{" "}
                      <span className="font-semibold text-foreground">{stats.mostGivenRate!.toFixed(1)}</span>
                    </p>
                    <RateHistogram stats={stats} height="h-14" showCounts={false} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">별점을 남기면 별점 분포와 플레이 시간을 보여드려요.</p>
                )}
              </HubCard>

              <section className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm">
                <h2 className="font-bold">플레이 캘린더</h2>
                <DiaryCalendar logs={logs} showList={false} />
              </section>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function CountLink({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 transition-opacity hover:opacity-70">
      <span className="font-display text-xl tabular-nums leading-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-bold">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          전체 <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function HubCard({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/50">
      <span className="flex items-center justify-between">
        <span className="font-bold">{title}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </span>
      {children}
    </Link>
  );
}

function HubBodySkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 divide-x rounded-2xl border bg-card py-3 shadow-sm">
        {["플레이", "별점", "쌓아둠"].map((label) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <SkeletonText className="font-display text-xl leading-tight" barClassName="w-8" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-3">
        <SectionHeader title="최근 플레이" />
        <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex w-[96px] shrink-0 flex-col gap-1.5">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <SkeletonText className="text-[13px] leading-tight" barClassName="w-4/5" />
              <SkeletonText className="-mt-1 text-[11px]" barClassName="w-10" />
            </div>
          ))}
        </div>
      </section>
      <Skeleton className="h-[150px] rounded-2xl" />
      <section className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="font-bold">플레이 캘린더</h2>
        <div className="flex flex-col gap-4">
          <div className="flex h-10 items-center justify-center">
            <SkeletonText className="font-bold" barClassName="w-28" />
          </div>
          <Skeleton className="aspect-[7/6.4] w-full rounded-md" />
        </div>
      </section>
    </>
  );
}

function MyHubSkeleton() {
  return (
    <MainLayout padded>
      <div className="mx-auto flex max-w-2xl lg:max-w-screen-xl flex-col gap-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="flex-1">
            <SkeletonText className="text-xl font-bold" barClassName="w-32" />
            <SkeletonText className="text-sm" barClassName="w-24" />
          </div>
        </div>
        <HubBodySkeleton />
      </div>
    </MainLayout>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
