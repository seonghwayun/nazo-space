"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NazoForm, type NazoPayload } from "@/components/admin/nazo-form";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { goBackOr } from "@/lib/form-routes";

export default function NewNazoPage() {
  const router = useRouter();
  const guard = useAdminGuard();

  if (guard !== "admin") {
    return guard === "loading" ? (
      <div className="flex items-center justify-center min-h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ) : null;
  }

  const handleSubmit = async (payload: NazoPayload) => {
    const res = await fetch("/api/nazo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("나조 추가에 실패했습니다.");
    const created = await res.json();
    router.replace(`/nazo/${created._id}`);
  };

  return (
    <NazoForm
      title="나조 추가"
      onSubmit={handleSubmit}
      onCancel={() => goBackOr(router, "/admin")}
    />
  );
}
