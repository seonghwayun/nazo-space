"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CreatorForm, type CreatorFormData } from "@/components/admin/creator-form";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { goBackOr } from "@/lib/form-routes";

interface EditCreatorClientProps {
  id: string;
  name: string;
  url: string;
}

export function EditCreatorClient({ id, name, url }: EditCreatorClientProps) {
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
    const res = await fetch(`/api/creator/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("제작자 수정에 실패했습니다.");
    // The creator page is a server component; back navigation would restore its
    // cached (old) render, so navigate to it fresh instead.
    router.replace(`/creator/${id}`);
  };

  return (
    <CreatorForm
      title="제작자 수정"
      initialData={{ name, url }}
      onSubmit={handleSubmit}
      onCancel={() => goBackOr(router, `/creator/${id}`)}
    />
  );
}
