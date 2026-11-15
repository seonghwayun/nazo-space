"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TagForm } from "@/components/admin/tag-form";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { goBackOr } from "@/lib/form-routes";

export default function NewTagPage() {
  const router = useRouter();
  const guard = useAdminGuard();

  if (guard !== "admin") {
    return guard === "loading" ? (
      <div className="flex items-center justify-center min-h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ) : null;
  }

  const handleSubmit = async (data: { name: string }) => {
    const res = await fetch("/api/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "태그 추가에 실패했습니다.");
    }
    goBackOr(router, "/admin");
  };

  return (
    <TagForm
      title="태그 추가"
      onSubmit={handleSubmit}
      onCancel={() => goBackOr(router, "/admin")}
    />
  );
}
