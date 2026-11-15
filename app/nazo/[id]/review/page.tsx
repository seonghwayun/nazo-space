"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Globe, Loader2, Lock, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StarInput } from "@/components/ui/stars";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { useToast } from "@/components/ui/toast";
import { goBackOr } from "@/lib/form-routes";
import { staleNazos } from "@/lib/stale-marks";
import { localDateKey, LIMITS, type PlayStatus } from "@/lib/play-log";
import { cn } from "@/lib/utils";
import { INazo } from "@/models/nazo";

const FORM_ID = "play-log-form";

interface Draft {
  status: PlayStatus;
  playedAt: string;
  durationMinutes: number | null;
  companions: string;
  rate: number | null;
  review: string;
  hasSpoiler: boolean;
  memo: string;
}

/** The play log form ("플레이 기록"): one page for status, play details, rating, review and memo. */
export default function PlayLogPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { status: authStatus } = useSession();
  const toast = useToast();

  const [nazo, setNazo] = useState<INazo | null>(null);
  const [draft, setDraft] = useState<Draft>({
    status: "played",
    playedAt: localDateKey(new Date()),
    durationMinutes: null,
    companions: "",
    rate: null,
    review: "",
    hasSpoiler: false,
    memo: "",
  });
  const [hasLog, setHasLog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const leave = () => goBackOr(router, `/nazo/${id}`);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace(`/nazo/${id}`);
  }, [authStatus, id, router]);

  useEffect(() => {
    if (!id || authStatus !== "authenticated") return;
    (async () => {
      try {
        const [nazoRes, logRes] = await Promise.all([fetch(`/api/nazo/${id}`), fetch(`/api/log/nazo/${id}`)]);
        if (nazoRes.ok) setNazo(await nazoRes.json());
        if (logRes.ok) {
          const log = await logRes.json();
          if (log) {
            setHasLog(true);
            setDraft({
              status: log.status,
              playedAt: log.playedAt ?? (log.status === "unplayed" ? localDateKey(new Date()) : ""),
              durationMinutes: log.durationMinutes,
              companions: log.companions,
              rate: log.rate,
              review: log.review,
              hasSpoiler: log.hasSpoiler,
              memo: log.memo,
            });
          }
        }
      } catch (e) {
        console.error("Failed to load play log", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, authStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/log/nazo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, playedAt: draft.playedAt || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      staleNazos.mark(id);
      toast(draft.status === "played" ? "플레이 기록을 저장했어요" : "쌓아둔 나조에 담았어요");
      leave();
    } catch {
      setError("저장하지 못했어요. 네트워크 연결을 확인해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/log/nazo/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      staleNazos.mark(id);
      toast("기록을 삭제했어요");
      leave();
    } catch {
      setError("삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || authStatus !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!nazo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-background gap-4">
        <p className="text-muted-foreground">나조를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  const played = draft.status === "played";

  return (
    <FormPageShell title="플레이 기록" formId={FORM_ID} onCancel={leave} isSaving={isSaving} error={error}>
      <form id={FORM_ID} onSubmit={handleSave} className="flex flex-col gap-7">
        {/* Nazo */}
        <div className="flex gap-3 items-center">
          <div className="relative shrink-0 w-12 aspect-[2/3] bg-muted rounded-md overflow-hidden">
            <Image src={nazo.imageUrl || `/api/image/${nazo._id}`} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold leading-snug line-clamp-2">{nazo.originalTitle}</h2>
            {nazo.translatedTitle && <p className="text-sm text-muted-foreground truncate">{nazo.translatedTitle}</p>}
          </div>
        </div>

        {/* Status */}
        <Field label="상태">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="radiogroup" aria-label="상태">
            {([
              ["played", "플레이했어요"],
              ["unplayed", "아직 안 했어요"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={draft.status === value}
                onClick={() => set("status", value)}
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold transition-colors",
                  draft.status === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {!played && (
            <p className="text-sm text-muted-foreground">
              사 두거나 해보고 싶은 나조를 <b className="text-foreground">쌓아둔 나조</b>에 담아둘게요. 플레이하고 나면 여기서 바꿔주세요.
            </p>
          )}
        </Field>

        {played && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="플레이한 날" icon={Calendar} htmlFor="playedAt">
                <Input
                  id="playedAt"
                  type="date"
                  value={draft.playedAt}
                  max={localDateKey(new Date())}
                  onChange={(e) => set("playedAt", e.target.value)}
                  className="h-11 w-full min-w-0 appearance-none"
                />
              </Field>
              <Field label="함께한 사람" icon={Users} htmlFor="companions">
                <Input
                  id="companions"
                  value={draft.companions}
                  placeholder="혼자, 친구 2명…"
                  maxLength={50}
                  onChange={(e) => set("companions", e.target.value)}
                  className="h-11"
                />
              </Field>
            </div>

            <Field label="걸린 시간" icon={Clock}>
              <DurationInput value={draft.durationMinutes} onChange={(v) => set("durationMinutes", v)} />
            </Field>

            <Field label="별점">
              <StarInput value={draft.rate} onChange={(v) => set("rate", v)} />
            </Field>

            <Field label="공개 리뷰" icon={Globe} htmlFor="review">
              <Textarea
                id="review"
                value={draft.review}
                placeholder="어땠나요? 정답이나 힌트는 아래 비공개 메모에 적어주세요."
                onChange={(e) => set("review", e.target.value)}
                className="min-h-[120px] text-base p-3"
              />
              <label className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>스포일러가 있어요 · 다른 사람에게는 가려서 보여줘요</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.hasSpoiler}
                  aria-label="스포일러 포함"
                  onClick={() => set("hasSpoiler", !draft.hasSpoiler)}
                  className={cn(
                    "relative h-[26px] w-11 shrink-0 rounded-full transition-colors",
                    draft.hasSpoiler ? "bg-stamp" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform",
                      draft.hasSpoiler && "translate-x-[18px]"
                    )}
                  />
                </button>
              </label>
            </Field>
          </>
        )}

        <Field label="비공개 메모 · 나만 보기" icon={Lock} htmlFor="memo">
          <Textarea
            id="memo"
            value={draft.memo}
            placeholder={played ? "풀이 과정, 정답, 기억하고 싶은 포인트…" : "어디서 샀는지, 언제 할지…"}
            onChange={(e) => set("memo", e.target.value)}
            className="min-h-[90px] text-base p-3"
          />
        </Field>

        <Button type="submit" size="lg" className="h-12 text-base" disabled={isSaving}>
          {isSaving ? "저장 중..." : played ? "기록 저장" : "쌓아둔 나조에 담기"}
        </Button>

        {hasLog &&
          (confirmDelete ? (
            <div className="flex flex-col gap-3 rounded-xl border border-stamp/60 bg-stamp/5 p-4 text-sm">
              <p>이 기록을 지울까요? 별점, 리뷰, 메모가 모두 사라지고 되돌릴 수 없어요.</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
                  취소
                </Button>
                <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" className="text-stamp hover:text-stamp" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> 기록 삭제
            </Button>
          ))}
      </form>
    </FormPageShell>
  );
}

function Field({
  label,
  icon: Icon,
  htmlFor,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Hours + minutes typed directly. Both empty means "not recorded". */
function DurationInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hours, setHours] = useState(value ? String(Math.floor(value / 60)) : "");
  const [minutes, setMinutes] = useState(value ? String(value % 60) : "");

  const update = (h: string, m: string) => {
    const hh = h.replace(/\D/g, "").slice(0, 3);
    const mm = m.replace(/\D/g, "").slice(0, 2);
    setHours(hh);
    setMinutes(mm);
    const total = Number(hh || 0) * 60 + Number(mm || 0);
    onChange(hh === "" && mm === "" ? null : Math.min(total, LIMITS.durationMinutes));
  };

  return (
    <div className="flex items-center self-start h-11 rounded-md border bg-card px-3 gap-1 text-sm focus-within:ring-[3px] focus-within:ring-ring/50">
      <input
        type="text"
        inputMode="numeric"
        aria-label="걸린 시간 (시간)"
        placeholder="0"
        value={hours}
        onChange={(e) => update(e.target.value, minutes)}
        className="w-8 min-w-0 bg-transparent text-right font-semibold tabular-nums outline-none"
      />
      <span className="text-muted-foreground">시간</span>
      <input
        type="text"
        inputMode="numeric"
        aria-label="걸린 시간 (분)"
        placeholder="0"
        value={minutes}
        onChange={(e) => update(hours, e.target.value)}
        className="w-7 min-w-0 bg-transparent text-right font-semibold tabular-nums outline-none ml-1"
      />
      <span className="text-muted-foreground">분</span>
    </div>
  );
}
