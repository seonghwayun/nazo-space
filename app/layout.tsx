import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Sans_JP, Dela_Gothic_One } from "next/font/google";
import "./globals.css";

import { BottomNav } from "@/components/layout/bottom-nav";
import { NavigationTracker } from "@/components/layout/navigation-tracker";
import { Providers } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { LAYOUT_HINT_SCRIPT } from "@/lib/layout-hints";
import { SITE_URL, shareMeta } from "@/lib/seo";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
});

// Display face for the logo, stamps and big numbers only.
const delaGothic = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dela-gothic",
});

export const metadata: Metadata = {
  // Pages set a plain title; the template adds the site name.
  title: { default: "Nazo Space - 나조토키 아카이브", template: "%s | Nazo Space" },
  description: "한국의 나조토키 플레이어를 위한 아카이브. 일본 나조토키(謎解き)의 정보와 후기, 평점, 플레이 기록을 한곳에서.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "./",
  },
  ...shareMeta({
    title: "나조토키 아카이브",
    description: "한국의 나조토키 플레이어를 위한 아카이브. 일본 나조토키의 정보와 후기, 평점, 플레이 기록을 한곳에서.",
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fd" },
    { media: "(prefers-color-scheme: dark)", color: "#14141f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The init script sets the theme class before React hydrates.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LAYOUT_HINT_SCRIPT }} />
      </head>
      <body
        className={`${notoSansKr.variable} ${notoSansJp.variable} ${delaGothic.variable} antialiased h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden font-sans`}
      >
        <Providers>
          <NavigationTracker />

          <div className="flex-1 w-full overflow-y-auto">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
