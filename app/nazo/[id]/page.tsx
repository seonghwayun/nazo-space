"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
// import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ImageIcon, Loader2, PenTool, Share2, Plus, Edit3, Eye, MoreHorizontal, Star, Pencil } from "lucide-react";
import { INazo } from "@/models/nazo";
import { RatingModal } from "@/components/nazo/rating-modal";
import { useSession } from "next-auth/react";
import { NazoFormModal } from "@/components/admin/nazo-form-modal";

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

export default function NazoDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [nazo, setNazo] = useState<INazo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [userRate, setUserRate] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<string>("");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit modal state

  useEffect(() => {
    async function fetchNazo() {
      if (!id) return;
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
  }, [id]);

  useEffect(() => {
    async function fetchReview() {
      if (!id || !session?.user) return;
      try {
        const res = await fetch(`/api/review/nazo/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setUserRate(data.rate);
            setUserReview(data.review || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch review", error);
      }
    }
    fetchReview();
  }, [id, session]);

  const handleSaveRate = async (rate: number, review: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/review/nazo/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate, review }),
      });

      if (!res.ok) throw new Error("Failed to save review");

      const data = await res.json();
      setUserRate(data.rate);
      setUserReview(data.review || "");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleRemoveRate = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/review/nazo/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete review");

      setUserRate(null);
      setUserReview("");
    } catch (error) {
      console.error(error);
      throw error;
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
      alert("Failed to update nazo");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <div className="flex flex-col pb-20">
        {/* Hero Section */}
        <div className="relative w-full h-[45vh] md:h-[55vh] shrink-0">
          <Image
            src={nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          <div className="absolute top-4 left-4 z-30">
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
            <div className="absolute top-4 right-20 z-30">
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

          <div className="absolute top-4 right-4 z-30">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-14 w-14"
            >
              <Share2 className="!h-8 !w-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 pt-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">{nazo.originalTitle}</h1>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center mb-1">
              <span>{nazo.difficulty ? `Difficulty ${nazo.difficulty}` : "Puzzle"}</span>
              <span>•</span>
              <span>{nazo.estimatedTime || "Untimed"}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {nazo.tags && nazo.tags.length > 0 && (
                <span>{nazo.tags.map(t => (typeof t === 'object' && 'name' in t ? (t as any).name : t)).join(' · ')}</span>
              )}
            </div>
          </div>
        </div>



        {/* Action Buttons Row */}
        <div className="px-4 py-4 flex justify-around items-center border-b border-border">
          <button className="flex flex-col items-center gap-1 min-w-[60px] text-muted-foreground hover:text-foreground">
            <Plus className="h-6 w-6" />
            <span className="text-[10px]">Want to</span>
          </button>
          <button className="flex flex-col items-center gap-1 min-w-[60px] text-muted-foreground hover:text-foreground">
            <Edit3 className="h-6 w-6" />
            <span className="text-[10px]">Comment</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 min-w-[60px] text-muted-foreground hover:text-foreground"
            onClick={() => setIsRatingModalOpen(true)}
          >
            {userRate ? (
              <>
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-foreground">{userRate}</span>
              </>
            ) : (
              <>
                <Star className="h-6 w-6" />
                <span className="text-[10px]">Rate</span>
              </>
            )}
          </button>
          <button className="flex flex-col items-center gap-1 min-w-[60px] text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-6 w-6" />
            <span className="text-[10px]">More</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{nazo.description}</p>
          </div>

          {nazo.creators && nazo.creators.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Creators</h3>
              <div className="flex flex-wrap gap-2">
                {nazo.creators.map((creator: any) => {
                  const bgColor = stringToColor(creator._id || creator.name);
                  return creator.url ? (
                    <a
                      key={creator._id}
                      href={creator.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: bgColor }}
                    >
                      <PenTool className="h-3 w-3 opacity-60" />
                      <span className="text-sm font-medium">{creator.name}</span>
                    </a>
                  ) : (
                    <div
                      key={creator._id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5"
                      style={{ backgroundColor: bgColor }}
                    >
                      <PenTool className="h-3 w-3 opacity-60" />
                      <span className="text-sm font-medium">{creator.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        initialRate={userRate || 0}
        initialReview={userReview}
        onSave={handleSaveRate}
        onRemove={handleRemoveRate}
        title="Rate this Nazo"
      />

      {session?.user?.isAdmin && nazo && isEditModalOpen && (
        <NazoFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateNazo}
          initialData={nazo}
          title="Edit Nazo"
        />
      )}    </div>
  );
}
