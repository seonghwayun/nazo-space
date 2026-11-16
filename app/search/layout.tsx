import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "나조토키 검색",
  description: "제목, 제작자, 태그로 일본 나조토키를 찾아보세요. 평점순·후기순 정렬과 안 해본 나조만 보기도 지원해요.",
  path: "/search",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
