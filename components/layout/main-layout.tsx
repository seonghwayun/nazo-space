import * as React from "react";
import { cn } from "@/lib/utils";

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padded?: boolean;
  fullWidth?: boolean;
}

export function MainLayout({ children, className, padded = false, fullWidth = false, ...props }: MainLayoutProps) {
  return (
    <main
      className={cn(
        "w-full h-full",
        !fullWidth && "max-w-screen-xl mx-auto",
        padded && "px-4 sm:px-6 md:px-8 py-6 md:py-10",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
