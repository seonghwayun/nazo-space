"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Globe, Lock, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { INazo } from "@/models/nazo";
import Image from "next/image";

export default function NazoReviewPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  const [nazo, setNazo] = useState<INazo | null>(null);
  const [review, setReview] = useState("");
  const [memo, setMemo] = useState("");
  const [playedAt, setPlayedAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id || !session?.user) return;
      try {
        const [nazoRes, reviewRes] = await Promise.all([
          fetch(`/api/nazo/${id}`),
          fetch(`/api/review/nazo/${id}`)
        ]);

        if (nazoRes.ok) {
          const nazoData = await nazoRes.json();
          setNazo(nazoData);
        }

        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          if (reviewData) {
            setReview(reviewData.review || "");
            setMemo(reviewData.memo || "");
            if (reviewData.playedAt) {
              setPlayedAt(new Date(reviewData.playedAt).toISOString().split('T')[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, session]);

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/review/nazo/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, memo, playedAt: playedAt ? new Date(playedAt) : null }),
      });

      if (!res.ok) throw new Error("Failed to save review");

      router.refresh();
      router.back();
    } catch (error) {
      console.error("Failed to save review:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!id) return;
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/review/nazo/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete review");

      router.refresh();
      router.back();
    } catch (error) {
      console.error("Failed to remove review:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!nazo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground">나조를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-10 flex flex-col max-w-2xl mx-auto relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          className="text-base font-medium px-0 hover:bg-transparent text-foreground"
          onClick={() => router.back()}
        >
          취소
        </Button>
        <span className="text-base font-bold">리뷰 작성</span>
        <Button
          variant="ghost"
          className="text-base font-medium px-0 hover:bg-transparent text-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : "확인"}
        </Button>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Brief Nazo Info */}
      <div className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm mb-8 mt-4">
        <div className="relative shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden">
          <Image
            src={nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-base truncate">{nazo.originalTitle}</h3>
          <p className="text-sm text-muted-foreground truncate">{nazo.translatedTitle}</p>
        </div>
      </div>

      {/* Played Date Section */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-2 text-base font-medium text-foreground">
          <Calendar className="h-5 w-5 text-green-500" />
          <span>플레이 날짜</span>
        </div>
        <div className="relative max-w-[200px]">
          <Input
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            className="w-full pr-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>


      {/* Form Fields */}
      <div className="space-y-8 flex-1 pb-10">
        {/* Public Review Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-medium text-foreground">
            <Globe className="h-5 w-5 text-blue-500" />
            <span>공개 리뷰</span>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-md text-sm text-blue-600 border border-blue-100">
            ⚠️ <strong>스포일러 금지:</strong> 다른 사람에게 보여지는 리뷰이니 퍼즐에 대한 답이나 힌트를 포함하지 마세요.
          </div>
          <Textarea
            placeholder="리뷰를 작성해주세요... (공개)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="min-h-[150px] resize-y text-base p-4"
          />
        </div>

        {/* Private Memo Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-medium text-foreground">
            <Lock className="h-5 w-5 text-amber-500" />
            <span>개인 메모</span>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-md text-sm text-amber-600 border border-amber-100">
            🔒 <strong>비공개 메모:</strong> 이 메모는 다른 사람들에게 보여지지 않습니다. 이 나조에 대해서 기억하고 싶은 포인트를 자유롭게 적어보세요.
          </div>
          <Textarea
            placeholder="개인 메모를 작성해주세요... (비공개)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="min-h-[100px] resize-y text-base p-4"
          />
        </div>

        {/* Delete Action - Moved to content flow */}
        {(review || memo) && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              onClick={handleRemove}
              disabled={isSaving || isRemoving}
            >
              {isRemoving ? "삭제 중..." : "리뷰 및 메모 삭제"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
