"use client";

import { MainLayout } from "@/components/layout/main-layout";
import Image from "next/image";
import { BackButton } from "@/components/ui/back-button";

export default function JyuunisiPage() {
  return (
    <MainLayout padded>
      <div className="max-w-screen-md mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BackButton className="h-12 w-12" iconClassName="h-8 w-8" />
          <h1 className="text-xl font-bold">일본어 12지</h1>
        </div>

        {/* Image */}
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
            <Image
              src="/jyuunisi.webp"
              alt="일본어 12지"
              width={1200}
              height={1600}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
