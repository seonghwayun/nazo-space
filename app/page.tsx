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
      // Minimum delay to show the spinner clearly
      const minDelay = new Promise(resolve => setTimeout(resolve, 800));

      const [res] = await Promise.all([
        fetch("/api/home"),
        !showLoading ? minDelay : Promise.resolve() // Only delay if it's a pull-to-refresh
      ]);

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

  // Native touch event handlers for non-passive listener support (needed for iOS preventDefault)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only track if at the top
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        // checking if we might be pulling
        // We don't set isPullingRef here strictly because we don't know direction yet,
        // but we can track the start.
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;

      // If we are pulling down at the top
      if (diff > 0 && container.scrollTop <= 0) {
        // Prevent native scrolling/rubber-banding
        if (e.cancelable) {
          e.preventDefault();
        }

        // Damping effect
        const damped = Math.min(diff * 0.45, 160);
        setPullY(damped);
      } else {
        // If we scroll back up or were not at top
        setPullY(0);
      }
    };

    const handleTouchEnd = () => {
      isPullingRef.current = false;

      // We need to read the current pullY state. 
      // Since we are continuously updating state, we might not have the latest value in closure 
      // without using a ref for pullY, OR we can trust the setPullY functional update logic, 
      // BUT for reading the final value to trigger action, we need a ref or access to state.
      // However, inside this useEffect, 'pullY' from scope is stale (0).
      // We need a ref to track the *current* pullY for the end handler.
    };

    // We attach handlers
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    // We'll handle touchend separately or here? 
    // Mixing React state and native listeners is tricky.
    // Let's rely on the ref for "current drag distance" to trigger the refresh?
    // Actually, let's store the current "damped" value in a ref too, to read it in touchEnd.

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLoading]); // Re-run when loading finishes and ref is attached

  // We need a way to trigger the end action. 
  // Let's use 'onTouchEnd' from React for the end event as that doesn't need preventDefault.
  // Wait, if we preventDefault on move, will touchEnd fire? Yes.

  // To solve the "stale pullY" in native listeners issue:
  const pullYRef = useRef(0);
  useEffect(() => {
    pullYRef.current = pullY;
  }, [pullY]);

  const handleTouchEnd = () => {
    isPullingRef.current = false;
    if (pullYRef.current > 70) {
      setIsRefreshing(true);
      fetchData(false);
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

  return (
    <MainLayout>
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto relative overscroll-y-contain"
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull Indicator */}
        <div
          className="absolute top-0 left-0 right-0 flex justify-center items-start pointer-events-none transition-all duration-300 ease-out z-10"
          style={{
            height: '60px',
            opacity: pullY > 0 || isRefreshing ? 1 : 0,
            visibility: (pullY > 0 || isRefreshing) ? 'visible' : 'hidden',
            transform: `translateY(${isRefreshing ? 20 : Math.max(pullY - 60, -60)}px)`
          }}
        >
          <div className="bg-background/80 backdrop-blur-sm shadow-md rounded-full p-2 border">
            <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} style={{ transform: isRefreshing ? 'none' : `rotate(${pullY * 2}deg)` }} />
          </div>
        </div>

        <div
          className="max-w-6xl mx-auto p-4 space-y-8 transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${isRefreshing ? 80 : pullY}px)` }}
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
