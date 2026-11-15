"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronRight, LogOut, Mail, Wrench } from "lucide-react";
import { MySubPage } from "@/components/my/my-sub-page";
import { ThemeToggle } from "@/components/theme-toggle";

const row = "flex h-12 items-center gap-3 px-4 text-sm font-medium transition-colors hover:bg-secondary";

export default function MySettingsPage() {
  const { data: session } = useSession();
  return (
    <MySubPage title="설정" isPublic>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold text-muted-foreground">화면</h2>
          <ThemeToggle className="rounded-xl border bg-card px-4 py-3" />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold text-muted-foreground">지원</h2>
          <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
            <a href="mailto:respace.cc@gmail.com" className={row}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">문의하기</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
            {session?.user?.isAdmin && (
              <Link href="/admin" className={row}>
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">나조 관리</span>
                <span className="text-xs text-muted-foreground">관리자</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </section>

        {session && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/my" })}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border bg-card text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        )}
      </div>
    </MySubPage>
  );
}
