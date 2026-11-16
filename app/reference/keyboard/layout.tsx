import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "일본어 핸드폰 자판 (플릭)",
  description: "나조토키에 자주 나오는 일본어 핸드폰 플릭 자판 배열표.",
  path: "/reference/keyboard",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
