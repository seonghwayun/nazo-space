import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { WadouClient } from "@/components/practice/wadou-client";

export const metadata: Metadata = { title: "가운데 한자 찾기 (和同開珎)" };

export default function WadouPage() {
  return (
    <MainLayout padded>
      <WadouClient />
    </MainLayout>
  );
}
