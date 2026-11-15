"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CreatorForm, type CreatorFormData } from "@/components/admin/creator-form";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { goBackOr } from "@/lib/form-routes";

export default function NewCreatorPage() {
  const router = useRouter();
  const guard = useAdminGuard();

  if (guard !== "admin") {
    return guard === "loading" ? (
      <div className="flex items-center justify-center min-h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ) : null;
  }

  const handleSubmit = async (data: CreatorFormData) => {
    const res = await fetch("/api/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("제작자 추가에 실패했습니다.");
    goBackOr(router, "/admin");
  };

  return (
    <CreatorForm
      title="제작자 추가"
      onSubmit={handleSubmit}
      onCancel={() => goBackOr(router, "/admin")}
    />
  );
}
