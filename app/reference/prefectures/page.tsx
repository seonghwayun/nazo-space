"use client";

import { MainLayout } from "@/components/layout/main-layout";
import Image from "next/image";
import { BackButton } from "@/components/ui/back-button";

export default function PrefecturesMapPage() {
  return (
    <MainLayout padded>
      <div className="max-w-screen-md mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BackButton className="h-12 w-12" iconClassName="h-8 w-8" />
          <h1 className="text-xl font-bold">도도부현 / 현청소재지</h1>
        </div>

        {/* Prefectures (Todouhuken) */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg border-l-4 border-indigo-500 pl-3">도도부현 (都道府県)</h2>
          <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
            <Image
              src="/todouhuken-namae_1.jpg"
              alt="Prefectures Map"
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Capital Locations (Kentyousyozaiti) */}
        <div className="space-y-3 pt-4">
          <h2 className="font-semibold text-lg border-l-4 border-rose-500 pl-3">현청소재지 (県庁所在地)</h2>
          <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
            <Image
              src="/kentyousyozaiti_1.jpg"
              alt="Prefectural Capitals Map"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Memory Song */}
        <div className="space-y-3 pt-4">
          <h2 className="font-semibold text-lg border-l-4 border-emerald-500 pl-3">도도부현 외우는 노래</h2>
          <div className="rounded-xl overflow-hidden border shadow-sm bg-black aspect-video relative">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/zFE0iqWm3kI?si=uGHvNjfepnwoGoVQ"
              title="도도부현 외우는 노래"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
