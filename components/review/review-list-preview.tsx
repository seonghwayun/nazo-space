"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReviewItem } from "./review-item";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function ReviewListPreview({ nazoId }: { nazoId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/review/list?nazoId=${nazoId}&limit=3`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.results);
          // Ideally API returns total count, or we infer from hasMore? 
          // For now, if we have results, we show the list.
          // hasMore check:
          if (data.results.length > 0) {
            setTotalCount(data.results.length); // minimal check
          }
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, [nazoId]);

  if (isLoading) {
    // Mirrors the loaded list below (header + ReviewItem cards).
    return (
      <div className="space-y-4 pt-8 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">플레이 후기</h3>
          <div className="h-8" />
        </div>
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-border/40">
              <div className="flex items-center justify-between">
                <SkeletonText className="text-sm font-semibold flex-1" barClassName="w-32" />
                <Skeleton className="h-[22px] w-12 rounded-md" />
              </div>
              <SkeletonText className="text-xs" barClassName="w-36" />
              <div>
                <SkeletonText className="text-sm leading-relaxed" />
                <SkeletonText className="text-sm leading-relaxed" barClassName="w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If no reviews, don't show the section or show "No reviews yet"
  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-8 border-t border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">플레이 후기</h3>
        <Link href={`/nazo/${nazoId}/reviews`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm h-8 px-2">
            모든 후기 보기 <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        {reviews.map((review) => (
          <ReviewItem key={review._id} review={review} />
        ))}
      </div>
    </div>
  );
}
