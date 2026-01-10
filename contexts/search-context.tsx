"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { INazo } from "@/models/nazo";
import { ICreator } from "@/models/creator";
import { ITag } from "@/models/tag";

export interface SearchResults {
  nazos: INazo[];
  creators: ICreator[];
  tags: ITag[];
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResults;
  setResults: React.Dispatch<React.SetStateAction<SearchResults>>;
  lastSearchedQuery: string;
  setLastSearchedQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ nazos: [], creators: [], tags: [] });
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        setResults,
        lastSearchedQuery,
        setLastSearchedQuery,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
}
