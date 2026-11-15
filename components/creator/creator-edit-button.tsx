"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface CreatorEditButtonProps {
  creator: {
    _id: string;
    name: string;
    url?: string;
  };
}

export function CreatorEditButton({ creator }: CreatorEditButtonProps) {
  const { data: session } = useSession();

  if (!session?.user?.isAdmin) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="h-8 w-8 ml-2 text-muted-foreground hover:text-primary"
    >
      <Link href={`/creator/${creator._id}/edit`} aria-label="제작자 수정">
        <Pencil className="h-4 w-4" />
      </Link>
    </Button>
  );
}
