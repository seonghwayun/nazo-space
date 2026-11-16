import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "히라가나 / 가타카나 표",
  description: "나조토키 풀 때 바로 보는 히라가나·가타카나 50음표.",
  path: "/reference/kana",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
