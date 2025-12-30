import * as React from "react";
import { cn } from "@/lib/utils";

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MainLayout({ children, className, ...props }: MainLayoutProps) {
  return (
    <main
      className={cn(
        "w-full max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 h-full",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
