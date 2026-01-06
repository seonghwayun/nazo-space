"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewItemProps {
  review: {
    _id: string;
    review?: string;
    createdAt: string;
    user: {
      nickname: string;
      image?: string | null;
    };
    rate?: number | null;
  };
}

export function ReviewItem({ review }: ReviewItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Heuristic: if text is longer than 150 chars, it *might* need expansion. 
  // A robust solution would use ref and scrollHeight, but this is a good start.
  const isLongText = (review.review?.length || 0) > 150;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/5 border border-border/40 hover:bg-secondary/10 hover:border-border/60 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{review.user.nickname}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(review.review ? review.createdAt : "").toLocaleDateString()}
          </span>
        </div>
        {review.rate && (
          <div className="flex items-center gap-0.5 text-xs font-medium bg-yellow-400/10 text-yellow-600 px-2 py-0.5 rounded-md border border-yellow-400/20">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span>{review.rate.toFixed(1)}</span>
          </div>
        )}
      </div>

      {review.review && (
        <div>
          <p
            className={`text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap ${!isExpanded ? "line-clamp-3" : ""
              }`}
          >
            {review.review}
          </p>
          {isLongText && (
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
