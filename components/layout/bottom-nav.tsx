"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "홈",
      href: "/",
      icon: Home,
    },
    {
      label: "검색",
      href: "/search",
      icon: Search,
    },
    {
      label: "참고",
      href: "/reference",
      icon: BookOpen,
    },
    {
      label: "마이",
      href: "/my",
      icon: User,
    },
  ];

  if (pathname?.endsWith("/review")) return null;

  return (
    <nav className="shrink-0 z-50 bg-background/80 backdrop-blur-lg border-t supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-screen-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
