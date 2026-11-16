import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { MainLayout } from "@/components/layout/main-layout";
import { WadouClient } from "@/components/practice/wadou-client";

export const metadata: Metadata = pageMeta({
  title: "가운데 한자 찾기 (和同開珎)",
  description: "주변 네 한자와 각각 단어를 이루는 가운데 한자를 찾는 나조토키 단골 문제(和同開珎) 연습.",
  path: "/practice/wadou",
});

export default function WadouPage() {
  return (
    <MainLayout padded>
      <WadouClient />
    </MainLayout>
  );
}
