"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { NazoPortraitCard } from "@/components/nazo/nazo-portrait-card";
import { NazoPortraitCardSkeleton } from "@/components/nazo/nazo-portrait-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Pencil, Check, X, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MyPage() {
  const { data: session, status } = useSession();
  const [ratedNazos, setRatedNazos] = useState<any[]>([]);
  const [isRatedLoading, setIsRatedLoading] = useState(true);

  // User Profile State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
          setNicknameInput(data.nickname || session.user.name || "");
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    }

    if (session?.user) {
      fetchUserProfile();
    }
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
        const updatedUser = await res.json();
        setUserProfile(updatedUser);
        setIsEditingNickname(false);
      }
    } catch (error) {
      console.error("Failed to save nickname", error);
    } finally {
      setIsSavingNickname(false);
    }
  };

  useEffect(() => {
    async function fetchRatedNazos() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/rate/user?limit=10");
        if (res.ok) {
          const data = await res.json();
          setRatedNazos(data.results || []);
        }
      } catch (error) {
        console.error("Failed to fetch rated nazos", error);
      } finally {
        setIsRatedLoading(false);
      }
    }

    if (session?.user) {
      fetchRatedNazos();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <MainLayout padded>
        <div className="flex flex-col gap-8 h-full">
          <div className="flex items-center gap-4 p-4 bg-card rounded-lg border shadow-sm">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-[140px] flex-shrink-0">
                  <NazoPortraitCardSkeleton className="w-full" hideRating />
                  <div className="mt-1 flex items-center justify-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

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

  return (
    <MainLayout padded>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border shadow-sm">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold">
                {session.user?.name?.[0] || "U"}
              </span>
            </div>
          )}

          <div className="flex-1">
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="h-8 w-40"
                  maxLength={20}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveNickname} disabled={isSavingNickname}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setIsEditingNickname(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{userProfile?.nickname}</h2>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground opacity-50 hover:opacity-100" onClick={() => {
                  setNicknameInput(userProfile?.nickname || "");
                  setIsEditingNickname(true);
                }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground text-sm">{session.user?.email}</p>
          </div>
        </div>



        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">내가 평가한 나조</h3>
            <Link href="/my/rated" className="text-sm text-muted-foreground flex items-center hover:text-foreground">
              더보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isRatedLoading ? (
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-[140px] flex-shrink-0">
                  <NazoPortraitCardSkeleton className="w-full" hideRating />
                  <div className="mt-1 flex items-center justify-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : ratedNazos.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
              {ratedNazos.map((item) => (
                <div key={item.nazo._id} className="w-[140px] flex-shrink-0">
                  <NazoPortraitCard nazo={item.nazo} hideRating className="w-full" />
                  <div className="mt-1 flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">내 평점 <span className="text-yellow-500">★ {item.myRate}</span></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground mb-2">아직 평가한 나조가 없습니다.</p>
              <Link href="/search">
                <Button variant="link" className="h-auto p-0 text-primary">
                  나조 찾으러 가기
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Link href="mailto:respace.cc@gmail.com" className="w-full">
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            문의하기
          </Button>
        </Link>

        <Button variant="outline" onClick={() => signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>

        {session.user?.isAdmin && (
          <Link href="/admin" className="w-full">
            <Button className="w-full" variant="default">
              나조 관리 (관리자)
            </Button>
          </Link>
        )}
      </div>
    </MainLayout>
  );
}
