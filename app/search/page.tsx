"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/main-layout";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { INazo } from "@/models/nazo";

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<INazo[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 500);

  React.useEffect(() => {
    async function fetchResults() {
      if (!debouncedQuery) {
        setResults([]);
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
      }
    }

    fetchResults();
  }, [debouncedQuery]);

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
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-4">
              {results.map((nazo: any) => (
                <div key={nazo._id} className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                  <h3 className="font-semibold text-lg">{nazo.originalTitle}</h3>
                  {nazo.translatedTitle && (
                    <p className="text-sm text-muted-foreground">{nazo.translatedTitle}</p>
                  )}
                  {nazo.description && <p className="mt-2 text-sm line-clamp-2">{nazo.description}</p>}
                </div>
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
