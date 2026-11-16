import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "도도부현 / 현청소재지",
  description: "나조토키에 자주 나오는 일본 47개 도도부현과 현청소재지 목록.",
  path: "/reference/prefectures",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
