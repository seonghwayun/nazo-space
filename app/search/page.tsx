"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/main-layout";
import { Search, Loader2, ImageIcon, Star, Gauge, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchContext } from "@/contexts/search-context";

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
  const debouncedQuery = useDebounce(query, 500);

  React.useEffect(() => {
    async function fetchResults() {
      // If we already have results matching our query (and no pending debounce change),
      // we might want to skip fetching to preserve state.
      // However, simplified logic: if debounced query matches last searched, don't fetch.
      if (debouncedQuery === lastSearchedQuery && debouncedQuery) {
        return;
      }

      if (!debouncedQuery) {
        setResults([]);
        setLastSearchedQuery("");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/nazo/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Failed to search:", error);
      } finally {
        setIsLoading(false);
        setLastSearchedQuery(debouncedQuery);
      }
    }

    fetchResults();
  }, [debouncedQuery]); // Removed lastSearchedQuery from dep array to avoid loops, though strict mode logic might differ.

  // Determine if we are effectively loading.
  const isSearching = query.length > 0 && (query !== debouncedQuery || (debouncedQuery !== lastSearchedQuery && isLoading));

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 h-full">
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search nazo..."
            className="pl-9 w-full bg-background"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isSearching ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 && query ? (
            <div className="grid gap-4">
              {results.map((nazo: any) => (
                <Link key={nazo._id} href={`/nazo/${nazo._id}`} className="block">
                  <div className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent/50 transition-colors">
                    <div className="relative shrink-0 w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                      <Image
                        src={nazo.imageUrl || `/api/image/${nazo._id}`}
                        alt={nazo.originalTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">

                      <h3 className="font-semibold text-lg truncate leading-tight">{nazo.originalTitle}</h3>
                      {nazo.translatedTitle && (
                        <p className="text-sm text-muted-foreground truncate">{nazo.translatedTitle}</p>
                      )}

                      {/* Metric Badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Rating Badge */}
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-xs font-semibold">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span>{nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}</span>
                        </div>

                        {/* Difficulty Badge */}
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-xs font-semibold">
                          <Gauge className="w-3 h-3" />
                          <span>{nazo.difficulty || "미정"}</span>
                        </div>

                        {/* Time Badge */}
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>{nazo.estimatedTime || "미정"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">Search results will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
