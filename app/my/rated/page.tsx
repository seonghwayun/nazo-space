"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { NazoCard } from "@/components/nazo/nazo-card";
import { Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function MyRatedPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [ratedNazos, setRatedNazos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);

  const fetchRatedNazos = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/rate/user?page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setRatedNazos((prev) => (pageNum === 1 ? data.results : [...prev, ...data.results]));
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch rated nazos", error);
    } finally {
      setIsLoading(false);
      loadingMoreRef.current = false;
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchRatedNazos(1);
    }
  }, [session]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchRatedNazos(nextPage);
            return nextPage;
          });
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore]
  );

  return (
    <MainLayout padded>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">내가 평가한 나조</h1>
        </div>

        {isLoading && page === 1 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ratedNazos.length > 0 ? (
          <div className="flex flex-col gap-4">
            {ratedNazos.map((item, index) => {
              if (index === ratedNazos.length - 1) {
                return (
                  <div ref={lastElementRef} key={`${item.nazo._id}-${index}`}>
                    <NazoCard nazo={item.nazo} myRate={item.myRate} />
                  </div>
                );
              }
              return (
                <div key={`${item.nazo._id}-${index}`}>
                  <NazoCard nazo={item.nazo} myRate={item.myRate} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            평가한 나조가 없습니다.
          </div>
        )}

        {hasMore && page > 1 && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
