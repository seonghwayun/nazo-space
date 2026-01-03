"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/main-layout";
import { Search, Loader2, ImageIcon, Star, Gauge, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchContext } from "@/contexts/search-context";
import { NazoCard } from "@/components/nazo/nazo-card";

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
      <div className="flex flex-col gap-6 px-4 sm:px-6 md:px-8 py-6 md:py-10 h-full">
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
                <NazoCard key={nazo._id} nazo={nazo} />
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
