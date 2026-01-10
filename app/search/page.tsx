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
import { INazo } from "@/models/nazo";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Suspense } from "react";

function SearchContent() {
  const {
    query,
    setQuery,
    results,
    setResults,
    lastSearchedQuery,
    setLastSearchedQuery,
  } = useSearchContext();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as "nazo" | "creator" | "tag") || "nazo";

  const handleTabChange = (tab: "nazo" | "creator" | "tag") => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 500);

  // Search Pagination State
  const [searchPages, setSearchPages] = React.useState({ nazo: 1, creator: 1, tag: 1 });
  const [searchHasMore, setSearchHasMore] = React.useState({ nazo: true, creator: true, tag: true });
  const [isMoreLoading, setIsMoreLoading] = React.useState(false);

  // Feed State (for empty query)
  const [feedNazos, setFeedNazos] = React.useState<INazo[]>([]);
  const [feedPage, setFeedPage] = React.useState(1);
  const [feedHasMore, setFeedHasMore] = React.useState(true);
  const [isFeedLoading, setIsFeedLoading] = React.useState(false);
  const observerTarget = React.useRef(null);

  // Feed Fetch Logic
  // Track the last page we successfully requested to prevent duplicate fetches on tab switch
  const lastFetchedPages = React.useRef({ nazo: 1, creator: 1, tag: 1 });

  const fetchFeed = React.useCallback(async (pageNum: number) => {
    setIsFeedLoading(true);
    try {
      const res = await fetch(`/api/nazo?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.data) {
        if (pageNum === 1) {
          setFeedNazos(data.data);
        } else {
          setFeedNazos((prev) => {
            const existingIds = new Set(prev.map((n) => String(n._id)));
            const newNazos = data.data.filter((n: INazo) => !existingIds.has(String(n._id)));
            return [...prev, ...newNazos];
          });
        }
        setFeedHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  // Search More Fetch Logic
  const fetchMoreSearch = React.useCallback(async (type: "nazo" | "creator" | "tag", pageNum: number) => {
    setIsMoreLoading(true);
    try {
      const res = await fetch(`/api/nazo/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}&page=${pageNum}&limit=20`);
      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        nazos: type === 'nazo' ? [...prev.nazos, ...data.nazos] : prev.nazos,
        creators: type === 'creator' ? [...prev.creators, ...data.creators] : prev.creators,
        tags: type === 'tag' ? [...prev.tags, ...data.tags] : prev.tags,
      }));

      // Update hasMore
      // Note: API returns arrays in plural keys: nazos, creators, tags
      const resultKey = type === 'nazo' ? 'nazos' : type === 'creator' ? 'creators' : 'tags';
      const count = data[resultKey]?.length || 0;

      setSearchHasMore((prev) => ({
        ...prev,
        [type]: count >= 20
      }));

    } catch (error) {
      console.error("Failed to load more search results:", error);
    } finally {
      setIsMoreLoading(false);
    }
  }, [debouncedQuery, setResults]);


  // Observer for Infinite Scroll (Handles both Feed and Search)
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Case 1: Search Results
          if (debouncedQuery) {
            if (searchHasMore[activeTab] && !isMoreLoading && !isLoading) {
              setSearchPages((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
            }
          }
          // Case 2: Feed (No Query)
          else if (activeTab === "nazo" && feedHasMore && !isFeedLoading) {
            setFeedPage((prev) => prev + 1);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [debouncedQuery, activeTab, searchHasMore, isMoreLoading, isLoading, feedHasMore, isFeedLoading]);

  // Effect: Trigger Feed Fetch on Page Change
  React.useEffect(() => {
    if (!debouncedQuery && activeTab === "nazo" && feedPage > 1) {
      fetchFeed(feedPage);
    }
  }, [feedPage, debouncedQuery, activeTab, fetchFeed]);

  // Effect: Trigger Search More Fetch on Page Change
  React.useEffect(() => {
    const p = searchPages[activeTab];
    // Only fetch if page incremented beyond what we last fetched
    if (debouncedQuery && p > 1 && p > lastFetchedPages.current[activeTab]) {
      lastFetchedPages.current[activeTab] = p;
      fetchMoreSearch(activeTab, p);
    }
  }, [searchPages, activeTab, debouncedQuery, fetchMoreSearch]);

  // Effect: Initial Feed Load
  React.useEffect(() => {
    if (!debouncedQuery && activeTab === "nazo" && feedNazos.length === 0) {
      fetchFeed(1);
    }
  }, [debouncedQuery, activeTab, fetchFeed, feedNazos.length]);


  // Effect: Initial Search Load (Reset)
  React.useEffect(() => {
    async function fetchInitialResults() {
      // Logic from useDebounce means debouncedQuery updates slightly later
      // We check if it matches last searched or if empty
      if (debouncedQuery === lastSearchedQuery && debouncedQuery) return;

      if (!debouncedQuery) {
        setResults({ nazos: [], creators: [], tags: [] });
        setLastSearchedQuery("");
        return;
      }

      setIsLoading(true);
      // Reset Pages and HasMore
      setSearchPages({ nazo: 1, creator: 1, tag: 1 });
      lastFetchedPages.current = { nazo: 1, creator: 1, tag: 1 };
      setSearchHasMore({ nazo: true, creator: true, tag: true });

      try {
        const response = await fetch(`/api/nazo/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setResults(data);

        // Initialize HasMore based on first batch
        setSearchHasMore({
          nazo: data.nazos.length >= 20,
          creator: data.creators.length >= 20,
          tag: data.tags.length >= 20
        });

      } catch (error) {
        console.error("Failed to search:", error);
      } finally {
        setIsLoading(false);
        setLastSearchedQuery(debouncedQuery);
      }
    }

    fetchInitialResults();
  }, [debouncedQuery]); // Intentionally minimal deps

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
              onClick={() => handleTabChange("nazo")}
            >
              나조
              {activeTab === "nazo" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "creator" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => handleTabChange("creator")}
            >
              제작자
              {activeTab === "creator" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "tag" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => handleTabChange("tag")}
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
            <div className="grid grid-cols-1 gap-4">
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

              {/* Load More Indicator */}
              {isMoreLoading && (
                <div className="py-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Infinite Scroll Anchor */}
              <div ref={observerTarget} className="h-4 w-full" />
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">"{query}"에 대한 {activeTab === "nazo" ? "나조" : activeTab === "creator" ? "제작자" : "태그"} 검색 결과가 없습니다.</p>
            </div>
          ) : activeTab === "nazo" ? (
            /* Feed View for Nazo */
            <div className="grid gap-4">
              {feedNazos.map((nazo) => (
                <NazoCard key={String(nazo._id)} nazo={nazo} />
              ))}
              {isFeedLoading && (
                <div className="grid gap-4">
                  {[1, 2, 3, 4, 5].map((i) => <NazoCardSkeleton key={`loading-${i}`} />)}
                </div>
              )}
              <div ref={observerTarget} className="h-4 w-full" />
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
