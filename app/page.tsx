"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { NazoPortraitCardSkeleton } from "@/components/nazo/nazo-portrait-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { NazoPortraitCard } from "@/components/nazo/nazo-portrait-card";
import { Plus, Star, PenTool } from "lucide-react";
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

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/home");
        if (!res.ok) throw new Error("Failed to fetch home data");
        const jsonData = await res.json();
        setData(jsonData);
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 space-y-8">
            {[1, 2, 3].map((sectionIndex) => (
              <section key={sectionIndex}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <NazoPortraitCardSkeleton key={i} />
                  ))}
                </div>
              </section>
            ))}
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
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 space-y-8">

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
