"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function MyPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <h2 className="text-xl font-bold">{session.user?.name}</h2>
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
          {/* Future My Page Content */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-2">내 나조</h3>
            <p className="text-sm text-muted-foreground">아직 푼 나조가 없습니다.</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </MainLayout>
  );
}
