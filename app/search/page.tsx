"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/main-layout";
import { Search, Loader2, ImageIcon, Star, Gauge, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchContext } from "@/contexts/search-context";
import { NazoCard } from "@/components/nazo/nazo-card";
import { NazoCardSkeleton } from "@/components/nazo/nazo-card-skeleton";

export default function SearchPage() {
  const {
    query,
    setQuery,
    results,
    setResults,
    lastSearchedQuery,
    setLastSearchedQuery,
  } = useSearchContext();

  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"nazo" | "creator" | "tag">("nazo");
  const debouncedQuery = useDebounce(query, 500);

  React.useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery === lastSearchedQuery && debouncedQuery) {
        return;
      }

      if (!debouncedQuery) {
        setResults({ nazos: [], creators: [], tags: [] });
        setLastSearchedQuery("");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/nazo/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        // The API now returns { nazos: [], creators: [], tags: [] }
        // If the API returns the old format { results: [] }, handle gracefully if needed, but we updated API already.
        setResults(data);
      } catch (error) {
        console.error("Failed to search:", error);
      } finally {
        setIsLoading(false);
        setLastSearchedQuery(debouncedQuery);
      }
    }

    fetchResults();
  }, [debouncedQuery]);

  const isSearching = query.length > 0 && (
    query !== debouncedQuery ||
    isLoading ||
    debouncedQuery !== lastSearchedQuery
  );

  // Determine which list to show
  const currentList =
    activeTab === "nazo" ? results.nazos :
      activeTab === "creator" ? results.creators :
        results.tags;

  return (

    <MainLayout fullWidth className="flex flex-col">
      {/* Header Section (Centered) */}
      <div className="w-full border-b bg-background shrink-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-10 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="검색어를 입력하세요..."
              className="pl-9 w-full bg-background"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex">
            <button
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "nazo" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setActiveTab("nazo")}
            >
              나조
              {activeTab === "nazo" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "creator" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setActiveTab("creator")}
            >
              제작자
              {activeTab === "creator" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "tag" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setActiveTab("tag")}
            >
              태그
              {activeTab === "tag" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area (Full Width) */}
      <div className="flex-1 overflow-y-auto w-full min-h-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {isSearching ? (
            <div className="grid gap-4">
              {activeTab === "nazo" ? (
                [1, 2, 3, 4, 5].map((i) => <NazoCardSkeleton key={i} />)
              ) : (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border rounded-lg bg-card">
                    {activeTab === "creator" && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/3" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : currentList?.length > 0 ? (
            <div className="grid gap-4">
              {activeTab === "nazo" && results.nazos.map((nazo) => (
                <NazoCard key={String(nazo._id)} nazo={nazo} />
              ))}

              {activeTab === "creator" && results.creators.map((creator) => (
                <Link key={String(creator._id)} href={`/creator/${creator._id}`}>
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-card text-card-foreground hover:bg-accent/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <span className="font-medium">{creator.name}</span>
                  </div>
                </Link>
              ))}

              {activeTab === "tag" && results.tags.map((tag) => (
                <Link key={String(tag._id)} href={`/tag/${tag._id}`}>
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-card text-card-foreground hover:bg-accent/50 transition-colors">
                    <span className="font-medium"># {tag.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">"{query}"에 대한 {activeTab === "nazo" ? "나조" : activeTab === "creator" ? "제작자" : "태그"} 검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">검색 결과가 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
