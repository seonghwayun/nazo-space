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
import { ChevronRight, Pencil, Check, X } from "lucide-react";
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
            <div className="flex gap-4 overflow-x-hidden">
              {[1, 2, 3].map(i => <NazoPortraitCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return (
      <MainLayout padded>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
          <h1 className="text-2xl font-bold">Nazo Space에 오신 것을 환영합니다</h1>
          <p className="text-muted-foreground text-center max-w-xs">
            나조 기록을 관리하려면 로그인해주세요.
          </p>
          <Button onClick={() => signIn("google")} className="w-full max-w-sm">
            Google로 로그인
          </Button>
        </div>
      </MainLayout>
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

        {session.user?.isAdmin && (
          <Link href="/admin" className="w-full">
            <Button className="w-full" variant="default">
              나조 관리 (관리자)
            </Button>
          </Link>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">내가 평가한 나조</h3>
            <Link href="/my/rated" className="text-sm text-muted-foreground flex items-center hover:text-foreground">
              더보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isRatedLoading ? (
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
              {[1, 2, 3, 4, 5].map(i => <NazoPortraitCardSkeleton key={i} />)}
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

        <Button variant="outline" onClick={() => signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </MainLayout>
  );
}
