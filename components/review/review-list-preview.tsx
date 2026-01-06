"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReviewItem } from "./review-item";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="space-y-4 py-8">
        <h3 className="text-lg font-bold">참가자 후기</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
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
