"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { goBackOr } from "@/lib/form-routes";

/**
 * Shell for /my/* sub-pages: sticky `‹ title` bar (the global header is hidden here),
 * a login prompt when signed out unless `public`, and a centered column.
 * `wide` lets lists use a PC screen (up to 1280px); forms and cards stay at 672px.
 */
export function MySubPage({
  title,
  action,
  isPublic = false,
  wide = false,
  children,
}: {
  title: string;
  action?: ReactNode;
  isPublic?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status } = useSession();
  const width = wide ? "max-w-2xl lg:max-w-screen-xl" : "max-w-2xl";

  return (
    <main className="w-full min-h-full">
      <div className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur-md">
        <div className={`mx-auto flex h-full ${width} items-center gap-1 px-2`}>
          <button
            type="button"
            aria-label="뒤로"
            onClick={() => goBackOr(router, "/my")}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 truncate text-base font-bold">{title}</h1>
          {action}
        </div>
      </div>
      <div className={`mx-auto ${width} px-4 py-4 pb-10`}>
        {!isPublic && status === "unauthenticated" ? (
          <div className="flex flex-col items-center gap-4 py-16 text-sm text-muted-foreground">
            로그인하면 내 기록을 볼 수 있어요.
            <Button asChild variant="outline">
              <Link href="/my">로그인하러 가기</Link>
            </Button>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
