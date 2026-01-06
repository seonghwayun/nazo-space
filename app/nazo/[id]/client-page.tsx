"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
// import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ImageIcon, Loader2, PenTool, Share2, Plus, Edit3, Eye, MoreHorizontal, Star, Pencil, Globe } from "lucide-react";
import { INazo } from "@/models/nazo";
import { useSession } from "next-auth/react";
import { NazoFormModal } from "@/components/admin/nazo-form-modal";
import { LoginModal } from "@/components/auth/login-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// ... (omitted)

export default function NazoDetailPage({ initialNazo }: ClientPageProps) {
  const router = useRouter();
  const { id } = useParams();
  const [nazo, setNazo] = useState<INazo | null>(initialNazo);
  const [isLoading, setIsLoading] = useState(!initialNazo);
  const { data: session } = useSession();
  const [userRate, setUserRate] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<string>("");
  const [userMemo, setUserMemo] = useState<string>(""); // Added memo state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);

  useEffect(() => {
    async function fetchNazo() {
      if (!id) return;
      // If we already have initial data matching the ID (which we should for SSR), skip fetch
      if (initialNazo && initialNazo._id.toString() === id) {
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
    async function fetchUserData() {
      if (!id || !session?.user) return;
      try {
        const [reviewRes, rateRes] = await Promise.all([
          fetch(`/api/review/nazo/${id}`),
          fetch(`/api/rate/nazo/${id}`)
        ]);

        if (reviewRes.ok) {
          const data = await reviewRes.json();
          if (data) {
            setUserReview(data.review || "");
            setUserMemo(data.memo || "");
          }
        }

        if (rateRes.ok) {
          const data = await rateRes.json();
          if (data) {
            setUserRate(data.rate);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    }
    fetchUserData();
  }, [id, session]);

  const checkAuth = () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSaveRate = async (rate: number) => {
    if (!checkAuth()) return;
    if (!id) return;

    // Optimistic Update
    const previousRate = userRate;
    setUserRate(rate);

    try {
      // Save Rate
      const rateRes = await fetch(`/api/rate/nazo/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      });

      if (!rateRes.ok) throw new Error("Failed to save rate");

      // Ideally the server returns the same rate we sent, or updated stats.
      // We can update nazo stats here if the API returned them, but for userRate, we already set it.
      const rateData = await rateRes.json();
      // Ensure state is consistent with server (optional, but good practice if server sanitizes input)
      setUserRate(rateData.rate);
    } catch (error) {
      console.error(error);
      // Revert on failure
      setUserRate(previousRate);
      alert("평점 저장에 실패했습니다.");
    }
  };



  const handleRemoveRate = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/rate/nazo/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete rate");

      setUserRate(null);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleDeleteReview = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/review/nazo/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete review");

      setUserReview("");
      setUserMemo("");
    } catch (error) {
      console.error("Failed to delete review", error);
      alert("리뷰 삭제에 실패했습니다.");
    }
  };



  const handleUpdateNazo = async (data: any) => {
    try {
      const res = await fetch(`/api/nazo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update nazo");

      const updatedNazo = await res.json();
      setNazo((prev: any) => ({ ...prev, ...updatedNazo }));
    } catch (error) {
      console.error("Failed to update nazo:", error);
      alert("나조 수정에 실패했습니다.");
    }
  };



  if (isLoading) {
    return (
      <div className="bg-background min-h-full">
        {/* Hero Skeleton */}
        <div className="relative w-full h-[45vh] md:h-[55vh] shrink-0 bg-muted animate-pulse">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 pt-12 z-10 space-y-3">
            <Skeleton className="h-10 w-3/4 bg-white/20" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 bg-white/20" />
              <Skeleton className="h-5 w-20 bg-white/20" />
              <Skeleton className="h-5 w-20 bg-white/20" />
            </div>
            <Skeleton className="h-4 w-1/2 bg-white/20" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-6">
          <div className="flex justify-center py-2 gap-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-10 h-10 rounded-sm" />)}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
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
        <div className="relative w-full h-[45vh] md:h-[55vh] shrink-0">
          <Image
            src={nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <div className="fixed top-4 left-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-14 w-14"
              onClick={() => router.back()}
            >
              <ChevronLeft className="!h-10 !w-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </Button>
          </div>

          {session?.user?.isAdmin && (
            <div className="fixed top-4 right-20 z-50">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-14 w-14"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Pencil className="!h-6 !w-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              </Button>
            </div>
          )}

          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-14 w-14"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="!h-8 !w-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 pt-12 z-10">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{nazo.originalTitle}</h1>
            <div className="text-sm flex flex-wrap gap-2 items-center mb-1 text-white/90 drop-shadow-sm">
              <span>
                평균평점 <span className="font-bold text-white">{nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}</span>
                <span className="text-white/70 ml-1 font-normal">({nazo.rateCount || 0})</span>
              </span>
              <span>•</span>
              <span>표기난이도 <span className="font-bold text-white">{nazo.difficulty ? nazo.difficulty : "불명"}</span></span>
              <span>•</span>
              <span>예상시간 <span className="font-bold text-white">{nazo.estimatedTime || "불명"}</span></span>
            </div>
            <div className="text-xs text-white/70 mb-1 drop-shadow-sm">
              {nazo.tags && nazo.tags.length > 0 && (
                <span>{nazo.tags.map(t => (typeof t === 'object' && 'name' in t ? (t as any).name : t)).join(' · ')}</span>
              )}
            </div>
          </div>
        </div>



        {/* Action Buttons Row */}
        {/* User Interaction Section */}
        <div className="p-6 border-b border-border bg-background">
          <div className="flex flex-col gap-4">
            {/* Rating Stars - Fancy Pill Design */}
            <div className="flex justify-center items-center py-1">
              <div className="flex items-center gap-4 px-6 py-1.5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((index) => {
                    // Calculate fill for 0.5 steps
                    const fill = Math.max(0, Math.min(1, (userRate || 0) - (index - 1)));
                    return (
                      <div
                        key={index}
                        className="relative cursor-pointer w-8 h-8 transition-transform hover:scale-110 active:scale-95"
                      >
                        {/* Background Star (Gray) */}
                        <Star
                          className="absolute inset-0 w-full h-full text-transparent fill-muted-foreground/20"
                          strokeWidth={0}
                        />

                        {/* Foreground Star (Yellow) - Clipped */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${fill * 100}%` }}
                        >
                          <Star
                            className="w-8 h-8 text-transparent fill-yellow-400 drop-shadow-sm"
                            strokeWidth={0}
                          />
                        </div>

                        {/* Interaction Layers */}
                        <div
                          className="absolute inset-y-0 left-0 w-1/2 z-10"
                          onClick={() => handleSaveRate(index - 0.5)}
                        />
                        <div
                          className="absolute inset-y-0 right-0 w-1/2 z-10"
                          onClick={() => handleSaveRate(index)}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-border/50" />

                {/* Score Number */}
                <span className="text-xl font-bold tabular-nums text-foreground min-w-[1.8em] text-center tracking-tight">
                  {userRate ? userRate.toFixed(1) : <span className="text-muted-foreground/30 text-lg">-</span>}
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-border/60" />

            {/* Review / Comment Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground/80">내 리뷰</span>
                {userReview ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted focus-visible:ring-0"
                      >
                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/nazo/${id}/review`)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        <span>수정</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteReview} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => {
                      if (checkAuth()) router.push(`/nazo/${id}/review`);
                    }}
                  >
                    <Edit3 className="h-5 w-5 text-muted-foreground" />
                  </Button>
                )}
              </div>

              {userReview ? (
                <div className="space-y-1">
                  <div
                    className={`cursor-pointer hover:opacity-80 transition-opacity relative group`}
                    onClick={() => router.push(`/nazo/${id}/review`)}
                  >
                    <p className={`text-base text-foreground font-medium whitespace-pre-wrap leading-relaxed ${!isReviewExpanded ? "line-clamp-3" : ""}`}>
                      {userReview}
                    </p>
                  </div>
                  {userReview.length > 100 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReviewExpanded(!isReviewExpanded);
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground font-medium"
                    >
                      {isReviewExpanded ? "접기" : "...더보기"}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => {
                    if (checkAuth()) router.push(`/nazo/${id}/review`);
                  }}
                >
                  <p className="text-sm text-muted-foreground">이 작품에 대한 생각을 자유롭게 남겨주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>

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
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 hover:opacity-80 transition-opacity"
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
        </div>
      </div>



      {
        session?.user?.isAdmin && nazo && isEditModalOpen && (
          <NazoFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleUpdateNazo}
            initialData={nazo}
            title="나조 수정"
          />
        )
      }

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={() => router.push("/my")}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
    </div>
  );
}
