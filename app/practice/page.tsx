import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ChevronRight, Grid3x3 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";

export const metadata: Metadata = pageMeta({
  title: "나조토키 문제 연습",
  description: "나조토키에 자주 나오는 유형을 직접 풀어 보며 연습해요.",
  path: "/practice",
});

export default function PracticePage() {
  return (
    <MainLayout padded>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">문제 연습</h1>
          <p className="text-muted-foreground mt-1 text-sm">나조에 자주 나오는 유형을 직접 풀어 보세요.</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/practice/wadou"
            className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-sm hover:shadow-md hover:bg-secondary/50 transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <Grid3x3 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">가운데 한자 찾기</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span lang="ja">和同開珎</span> · 네 단어에 공통으로 들어갈 한자 한 글자
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
