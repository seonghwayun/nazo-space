import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { WadouClient } from "@/components/practice/wadou-client";

export const metadata: Metadata = { title: "和同開珎 연습" };

export default function WadouPage() {
  return (
    <MainLayout padded>
      <WadouClient />
    </MainLayout>
  );
}
