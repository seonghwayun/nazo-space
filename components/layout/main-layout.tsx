import * as React from "react";
import { cn } from "@/lib/utils";

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MainLayout({ children, className, ...props }: MainLayoutProps) {
  return (
    <main
      className={cn(
        "w-full max-w-screen-xl mx-auto h-full",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
