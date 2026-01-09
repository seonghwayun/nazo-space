"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { NazoPortraitCardSkeleton } from "@/components/nazo/nazo-portrait-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { NazoPortraitCard } from "@/components/nazo/nazo-portrait-card";
import { Plus, Star, PenTool, Loader2 } from "lucide-react";
import { INazo } from "@/models/nazo";
import { Button } from "@/components/ui/button";

interface HomeData {
  recent: INazo[];
  topRated: INazo[];
  recentlyReviewed: INazo[];
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPullingRef = useRef(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch("/api/home");
      if (!res.ok) throw new Error("Failed to fetch home data");
      const jsonData = await res.json();
      setData(jsonData);
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPullingRef.current = true;
    } else {
      isPullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Only allow pulling down if we are at the top
    if (diff > 0 && scrollContainerRef.current?.scrollTop === 0) {
      // Damping effect
      const damped = Math.min(diff * 0.4, 120); // Cap at 120px
      setPullY(damped);
      // Prevent default to stop native rubber banding if possible, 
      // but strictly preventing default might block scroll. 
      // Usually we don't prevent default on body unless we are sure.
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = () => {
    isPullingRef.current = false;
    if (pullY > 60) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullY(60); // Keep loader visible
      fetchData(false); // Fetch without full page loading state if preferred, or handle isRefreshing separately
    } else {
      setIsRefreshing(false);
      setPullY(0);
    }
  };

  // Reset pullY when refreshing stops
  useEffect(() => {
    if (!isRefreshing) {
      setPullY(0);
    }
  }, [isRefreshing]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 space-y-8">
            {/* Recently Added Loading */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">최근 추가된 나조</h2>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {[1, 2, 3, 4, 5].map((i) => (
                  <NazoPortraitCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Top Rated Loading */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">평점이 높은 나조</h2>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {[1, 2, 3, 4, 5].map((i) => (
                  <NazoPortraitCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Recently Reviewed Loading */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">최근 리뷰가 등록된 나조</h2>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {[1, 2, 3, 4, 5].map((i) => (
                  <NazoPortraitCardSkeleton key={i} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Helper for Section Header
  const SectionHeader = ({ icon: Icon, title, link }: { icon: any, title: string, link?: string }) => (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link href={link}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            더보기
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull Indicator */}
        <div
          className="absolute top-0 left-0 right-0 flex justify-center items-start pointer-events-none transition-transform duration-200 ease-out z-10"
          style={{
            height: isRefreshing ? '60px' : `${pullY}px`,
            opacity: pullY > 0 || isRefreshing ? 1 : 0,
            transform: `translateY(${pullY > 0 ? pullY - 40 : isRefreshing ? 20 : -40}px)`
          }}
        >
          <div className="bg-background/80 backdrop-blur-sm shadow-md rounded-full p-2 border">
            <Loader2 className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`} style={{ transform: `rotate(${pullY * 2}deg)` }} />
          </div>
        </div>

        <div
          className="max-w-6xl mx-auto p-4 space-y-8 transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${pullY}px)` }}
        >
          {/* Welcome Banner */}


          {/* Sections */}
          {data && (
            <>
              {/* Recently Added */}
              <section>
                <SectionHeader icon={Plus} title="최근 추가된 나조" link="/search" />
                {data.recent.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {data.recent.map((nazo) => (
                      <NazoPortraitCard key={nazo._id as unknown as string} nazo={nazo} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    등록된 나조가 없습니다.
                  </div>
                )}
              </section>

              {/* Top Rated */}
              <section>
                <SectionHeader icon={Star} title="평점이 높은 나조" />
                {data.topRated.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {data.topRated.map((nazo, i) => (
                      <NazoPortraitCard key={nazo._id as unknown as string} nazo={nazo} rank={i + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    평점이 등록된 나조가 없습니다.
                  </div>
                )}
              </section>

              {/* Recently Reviewed */}
              <section>
                <SectionHeader icon={PenTool} title="최근 리뷰가 등록된 나조" />
                {data.recentlyReviewed.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {data.recentlyReviewed.map((nazo) => (
                      <NazoPortraitCard key={nazo._id as unknown as string} nazo={nazo} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    리뷰가 등록된 나조가 없습니다.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
