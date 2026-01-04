"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  iconClassName?: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BackButton({ className, iconClassName, variant = "ghost", size = "icon" }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("h-10 w-10", className)}
      onClick={() => router.back()}
    >
      <ChevronLeft className={cn("h-6 w-6", iconClassName)} />
    </Button>
  );
}
