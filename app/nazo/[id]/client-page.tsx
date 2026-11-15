"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { staleNazos } from "@/lib/stale-marks";
import { NazoDetailSkeleton } from "@/components/nazo/nazo-detail-skeleton";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
// import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PenTool, Share2, Pencil, Plus } from "lucide-react";
import { INazo } from "@/models/nazo";
import { useSession } from "next-auth/react";
import { LoginModal } from "@/components/auth/login-modal";
import { MyLogCard, type PlayLog } from "@/components/log/my-log-card";
import { useToast } from "@/components/ui/toast";

// Helper to generate a consistent pastel color from a string
function stringToColor(str: string) {
  if (!str) return 'hsl(0, 0%, 90%)'; // Fallback color
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Hue: 0-360
  const h = Math.abs(hash % 360);
  // Saturation: 60-80% for vibrancy
  const s = 70;
  // Lightness: 85-95% for pastel background
  const l = 90;

  return `hsl(${h}, ${s}%, ${l}%)`;
}

interface ClientPageProps {
  initialNazo: INazo;
}

import { ShareModal } from "@/components/nazo/share-modal";
import { ReviewListPreview } from "@/components/review/review-list-preview";
import { ImageModal } from "@/components/ui/image-modal";

// ... (omitted)

export default function NazoDetailPage({ initialNazo }: ClientPageProps) {
  const router = useRouter();
  const { id } = useParams();
  const [nazo, setNazo] = useState<INazo | null>(initialNazo);
  const [isLoading, setIsLoading] = useState(!initialNazo);
  const { data: session } = useSession();
  const toast = useToast();
  const [myLog, setMyLog] = useState<PlayLog | null>(null);
  const [isLogBusy, setIsLogBusy] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    async function fetchNazo() {
      if (!id) return;
      // If we already have initial data matching the ID (which we should for SSR), skip fetch
      if (initialNazo && initialNazo._id.toString() === id && !staleNazos.consume(String(id))) {
        setIsLoading(false);
        return;
      }

      try {
        // ... existing fetchNazo logic ...
        const res = await fetch(`/api/nazo/${id}`);
        if (!res.ok) throw new Error("Failed to fetch nazo");
        const data = await res.json();
        setNazo(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNazo();
  }, [id, initialNazo]);

  useEffect(() => {
    if (!id || !session?.user) return;
    fetch(`/api/log/nazo/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((log) => setMyLog(log))
      .catch((error) => console.error("Failed to fetch play log", error));
  }, [id, session]);

  const openLogForm = () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }
    router.push(`/nazo/${id}/review`);
  };

  const addToUnplayed = async () => {
    setIsLogBusy(true);
    try {
      const res = await fetch(`/api/log/nazo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unplayed" }),
      });
      if (!res.ok) throw new Error();
      setMyLog(await res.json());
      toast("쌓아둔 나조에 담았어요");
    } catch {
      toast("담지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setIsLogBusy(false);
    }
  };

  if (isLoading) {
    return <NazoDetailSkeleton />;
  }

  if (!nazo) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Nazo not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full relative">
      <div className="flex flex-col">
        {/* Hero Section */}
        <div
          className="relative w-full h-[45vh] md:h-[55vh] shrink-0 cursor-pointer group bg-black overflow-hidden"
          onClick={() => setIsImageModalOpen(true)}
        >
          {/* Blurred Background Layer - Fills the container, highly blurred */}
          <div className="absolute inset-0 z-0">
            <Image
              src={nazo.imageUrl || `/api/image/${nazo._id}`}
              alt={nazo.originalTitle}
              fill
              className="object-cover blur-3xl opacity-50 scale-110"
              priority
            />
          </div>

          {/* Main Image Layer - Contained */}
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <Image
              src={nazo.imageUrl || `/api/image/${nazo._id}`}
              alt={nazo.originalTitle}
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <div className="fixed top-4 left-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/25 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-11 w-11"
              onClick={(e) => {
                e.stopPropagation();
                router.back();
              }}
              aria-label="뒤로"
            >
              <ChevronLeft className="!h-7 !w-7" />
            </Button>
          </div>

          {session?.user?.isAdmin && (
            <div className="fixed top-4 right-[68px] z-50">
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/25 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-11 w-11"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/nazo/${id}/edit`);
                }}
                aria-label="나조 수정 (관리자)"
              >
                <Pencil className="!h-5 !w-5" />
              </Button>
            </div>
          )}

          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/25 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-11 w-11"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              aria-label="공유"
            >
              <Share2 className="!h-5 !w-5" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 w-full px-6 pt-12 pb-10 z-10">
            <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-md text-balance">{nazo.originalTitle}</h1>
            {nazo.translatedTitle && (
              <p className="text-sm text-white/80 drop-shadow-sm">{nazo.translatedTitle}</p>
            )}
          </div>
        </div>



        {/* Facts */}
        <dl className="relative z-10 -mt-5 mx-4 grid grid-cols-3 rounded-2xl bg-card border shadow-sm divide-x">
          <Fact label="평균 별점">
            {nazo.rateCount ? (
              <>
                <span className="text-star">★</span>
                {(nazo.averageRate ?? 0).toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">({nazo.rateCount})</span>
              </>
            ) : (
              <span className="font-normal text-muted-foreground">아직 없음</span>
            )}
          </Fact>
          <Fact label="난이도">{nazo.difficulty || "미정"}</Fact>
          <Fact label="예상 시간">{nazo.estimatedTime || "미정"}</Fact>
        </dl>

        <div className="h-4" />
        <MyLogCard
          nazoId={String(nazo._id)}
          log={myLog}
          isSignedIn={!!session}
          onRequireLogin={() => setIsLoginModalOpen(true)}
          onAddUnplayed={addToUnplayed}
          isBusy={isLogBusy}
        />

        {/* Content Section */}
        <div className="p-6 space-y-6">


          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">설명</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{nazo.description}</p>
          </div>

          {nazo.creators && nazo.creators.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">제작자</h3>
              <div className="flex flex-wrap gap-2">
                {nazo.creators.map((creator: any) => {
                  const bgColor = stringToColor(creator._id || creator.name);
                  return (
                    <Link
                      key={creator._id}
                      href={`/creator/${creator._id}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 text-slate-900 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: bgColor }}
                    >
                      <PenTool className="h-3 w-3 opacity-60" />
                      <span className="text-sm font-medium">{creator.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {nazo.tags && nazo.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">태그</h3>
              <div className="flex flex-wrap gap-2">
                {nazo.tags.map((tag: any) => (
                  <Link
                    key={tag._id || tag} // Handle both populated and unpopulated tags
                    href={`/tag/${tag._id || tag}`}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 transition-opacity"
                  >
                    #{typeof tag === 'object' && 'name' in tag ? tag.name : tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <ReviewListPreview nazoId={nazo._id as unknown as string} />
        </div>

        {/* Sticky record button */}
        <div className="sticky bottom-0 z-20 px-4 pt-6 pb-3 bg-gradient-to-t from-background via-background to-transparent">
          <Button size="lg" className="w-full h-12 text-base rounded-xl" onClick={openLogForm}>
            {myLog?.status === "played" ? <Pencil /> : <Plus />}
            {myLog?.status === "played" ? "기록 수정하기" : "플레이 기록하기"}
          </Button>
        </div>
      </div>




      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={() => router.push("/my")}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        nazo={nazo}
      />

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={nazo.imageUrl || `/api/image/${nazo._id}`}
        alt={nazo.originalTitle}
      />
    </div >
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-3 min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-bold truncate max-w-full">{children}</dd>
    </div>
  );
}
