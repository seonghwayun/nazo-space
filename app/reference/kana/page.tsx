"use client";

import { MainLayout } from "@/components/layout/main-layout";
import Image from "next/image";
import { BackButton } from "@/components/ui/back-button";

export default function KanaChartPage() {
  return (
    <MainLayout padded>
      <div className="max-w-screen-md mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          <h1 className="text-xl font-bold">히라가나 / 가타카나 표</h1>
        </div>

        {/* Hiragana */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg border-l-4 border-indigo-500 pl-3">히라가나</h2>
          <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
            <Image
              src="/hiragana.png"
              alt="Hiragana Chart"
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Katakana */}
        <div className="space-y-3 pt-4">
          <h2 className="font-semibold text-lg border-l-4 border-rose-500 pl-3">가타카나</h2>
          <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
            <Image
              src="/katakana.png"
              alt="Katakana Chart"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
