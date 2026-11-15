"use client";

import { useState } from "react";
import { Star, Eye } from "lucide-react";

interface ReviewItemProps {
  review: {
    _id: string;
    review?: string;
    hasSpoiler?: boolean;
    createdAt: string;
    user: {
      nickname: string;
      image?: string | null;
    };
    rate?: number | null;
    playedAt?: string;
  };
}

export function ReviewItem({ review }: ReviewItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isHidden = !!review.hasSpoiler && !isRevealed;

  // Heuristic: if text is longer than 150 chars, it *might* need expansion. 
  // A robust solution would use ref and scrollHeight, but this is a good start.
  const isLongText = (review.review?.length || 0) > 150;

  return (

    <div className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/5 border border-border/40 hover:bg-secondary/10 hover:border-border/60 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{review.user.nickname}</span>
          {review.hasSpoiler && (
            <span className="text-[11px] font-semibold text-stamp bg-stamp/10 px-1.5 py-0.5 rounded">스포일러</span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(review.review ? review.createdAt : "").toLocaleDateString()}
          </span>
        </div>
        {review.rate && (
          <div className="flex items-center gap-0.5 text-xs font-medium bg-star/10 text-foreground px-2 py-0.5 rounded-md border border-star/30">
            <Star className="w-3 h-3 fill-star text-star" />
            <span>{review.rate.toFixed(1)}</span>
          </div>
        )}
      </div>

      {review.playedAt && (
        <div className="text-xs text-muted-foreground">
          플레이 날짜: {new Date(review.playedAt).toLocaleDateString()}
        </div>
      )}

      {review.review && (
        <div className="relative">
          <p
            aria-hidden={isHidden}
            className={`text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap ${!isExpanded ? "line-clamp-3" : ""
              } ${isHidden ? "blur-[6px] select-none" : ""}`}
          >
            {review.review}
          </p>
          {isHidden && (
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-md bg-secondary/50 text-sm font-semibold"
            >
              <Eye className="h-4 w-4" /> 스포일러가 있어요 · 탭해서 보기
            </button>
          )}
          {isLongText && !isHidden && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium mt-1 underline-offset-4 hover:underline"
            >
              {isExpanded ? "접기" : "더보기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
