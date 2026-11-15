"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NazoForm, type NazoPayload } from "@/components/admin/nazo-form";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { goBackOr } from "@/lib/form-routes";
import { staleNazos } from "@/lib/stale-marks";

export default function EditNazoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const guard = useAdminGuard();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nazo, setNazo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (guard !== "admin" || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/nazo/${id}`);
        if (res.ok && !cancelled) setNazo(await res.json());
      } catch (error) {
        console.error("Failed to load nazo", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guard, id]);

  if (guard === "denied") return null;

  if (guard === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!nazo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-20 gap-4">
        <p className="text-muted-foreground">나조를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => goBackOr(router, "/")}>
          돌아가기
        </Button>
      </div>
    );
  }

  const handleSubmit = async (payload: NazoPayload) => {
    const res = await fetch(`/api/nazo/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("나조 수정에 실패했습니다.");
    // Back navigation restores the cached detail page; make it refetch once.
    staleNazos.mark(id);
    goBackOr(router, `/nazo/${id}`);
  };

  return (
    <NazoForm
      title="나조 수정"
      initialData={nazo}
      onSubmit={handleSubmit}
      onCancel={() => goBackOr(router, `/nazo/${id}`)}
    />
  );
}
