"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  // Hide header on nazo detail page but show on others
  // Check if pathname starts with /nazo/ followed by an ID
  if ((pathname?.startsWith("/nazo/") && pathname.split("/").length > 2) || pathname?.startsWith("/creator/")) {
    return null;
  }

  return (
    <header className="shrink-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-center relative">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Nazo Space Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-bold text-xl leading-none">Nazo Space</span>
        </Link>
      </div>
    </header>
  );
}
