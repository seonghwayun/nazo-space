"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { CreatorFormModal } from "@/components/admin/creator-form-modal";
import { useRouter } from "next/navigation";

interface CreatorEditButtonProps {
  creator: {
    _id: string;
    name: string;
    url?: string;
  };
}

export function CreatorEditButton({ creator }: CreatorEditButtonProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  if (!session?.user?.isAdmin) return null;

  const handleUpdate = async (data: { name: string; url: string }) => {
    try {
      const res = await fetch(`/api/creator/${creator._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update creator");

      router.refresh(); // Refresh server component data
    } catch (error) {
      console.error("Update failed", error);
      alert("제작자 정보 수정에 실패했습니다.");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 ml-2 text-muted-foreground hover:text-primary"
        onClick={() => setIsModalOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <CreatorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdate}
        title="제작자 수정"
        initialData={{
          name: creator.name,
          url: creator.url || "",
        }}
      />
    </>
  );
}
