"use client";

import { MainLayout } from "@/components/layout/main-layout";
import Image from "next/image";
import { BackButton } from "@/components/ui/back-button";

export default function KeyboardChartPage() {
  return (
    <MainLayout padded>
      <div className="max-w-screen-md mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          <h1 className="text-xl font-bold">일본어 핸드폰 자판 (Flick)</h1>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl overflow-hidden border shadow-sm bg-white flex justify-center">
            {/* The filename has a typo 'kayout' as provided by user */}
            <Image
              src="/flick_keyboard_kayout.svg"
              alt="Japanese Flick Keyboard Layout"
              width={800}
              height={800}
              className="w-full max-w-sm h-auto"
              priority
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            각 행의 '아'단을 기준으로 상하좌우로 밀어서(Flick) 입력하는 방식입니다.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
