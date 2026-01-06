"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";
import { ReviewItem } from "@/components/review/review-item";
import { BackButton } from "@/components/ui/back-button";

export default function ReviewsPage() {
  const params = useParams();
  const nazoId = params.id as string;

  const [reviews, setReviews] = useState<any[]>([]);
  const [nazoTitle, setNazoTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNazoInfo() {
      try {
        const res = await fetch(`/api/nazo/${nazoId}`);
        if (res.ok) {
          const data = await res.json();
          setNazoTitle(data.originalTitle);
        }
      } catch (error) {
        console.error("Failed to fetch nazo info", error);
      }
    }
    if (nazoId) fetchNazoInfo();
  }, [nazoId]);

  const fetchReviews = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      const res = await fetch(`/api/review/list?nazoId=${nazoId}&page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setReviews(data.results);
        } else {
          setReviews((prev) => [...prev, ...data.results]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [nazoId]);

  useEffect(() => {
    if (nazoId) {
      fetchReviews(1);
    }
  }, [nazoId, fetchReviews]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchReviews(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, fetchReviews]);

  return (
    <MainLayout padded>
      <div className="max-w-screen-md mx-auto min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 mb-6 flex items-center gap-2 border-b">
          <BackButton />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h1 className="text-xl font-bold whitespace-nowrap shrink-0">모든 후기</h1>
            {nazoTitle && (
              <span className="text-base font-medium text-muted-foreground truncate border-l pl-2 border-border/60">
                {nazoTitle}
              </span>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-1">
          {reviews.map((review) => (
            <ReviewItem key={review._id} review={review} />
          ))}

          {reviews.length === 0 && !isLoading && (
            <div className="text-center py-20 text-muted-foreground">
              아직 작성된 후기가 없습니다.
            </div>
          )}
        </div>

        {/* Loading / Observer Trigger */}
        <div ref={observerTarget} className="py-8 flex justify-center">
          {(isLoading || isFetchingMore) && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
