import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "일본어 12지",
  description: "나조토키에 자주 나오는 일본어 12지(子丑寅卯…) 읽는 법과 순서.",
  path: "/reference/jyuunisi",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
