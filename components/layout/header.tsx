"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="shrink-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-center relative">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-lg tracking-tight">Nazo Space</span>
        </Link>
      </div>
    </header>
  );
}
