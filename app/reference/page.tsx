import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { ChevronRight, Languages, Keyboard } from "lucide-react";

export default function ReferencePage() {
  return (
    <MainLayout padded>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">참고 자료</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            나조 풀이에 도움이 되는 유용한 자료들을 모았습니다.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/reference/kana"
            className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-sm hover:shadow-md hover:bg-secondary/50 transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <Languages className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">히라가나 / 가타카나 표</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                일본어 50음도를 한눈에 확인하세요.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link
            href="/reference/keyboard"
            className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-sm hover:shadow-md hover:bg-secondary/50 transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Keyboard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">일본어 핸드폰 자판 (Flick)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                일본어 입력 시 사용하는 플릭 입력 배열입니다.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          {/* Additional resources can be added here */}
        </div>
      </div>
    </MainLayout>
  );
}
