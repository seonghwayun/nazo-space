import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nazo Space",
  description: "한국의 나조토키 플레이어를 위한 아카이브, Nazo Space",
  metadataBase: new URL("https://nazo.respace.cc"), // Update with actual domain when deployed
  openGraph: {
    title: "Nazo Space",
    description: "한국의 나조토키 플레이어를 위한 아카이브",
    url: "https://nazo.respace.cc",
    siteName: "Nazo Space",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nazo Space",
    description: "한국의 나조토키 플레이어를 위한 아카이브",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden`}
      >
        <Providers>
          <Header />
          <div className="flex-1 w-full overflow-y-auto">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
