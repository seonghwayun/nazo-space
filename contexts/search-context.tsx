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
  // Feed State
  feedNazos: INazo[];
  setFeedNazos: React.Dispatch<React.SetStateAction<INazo[]>>;
  feedPage: number;
  setFeedPage: React.Dispatch<React.SetStateAction<number>>;
  feedHasMore: boolean;
  setFeedHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ nazos: [], creators: [], tags: [] });
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  // Feed State
  const [feedNazos, setFeedNazos] = useState<INazo[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        setResults,
        lastSearchedQuery,
        setLastSearchedQuery,
        feedNazos,
        setFeedNazos,
        feedPage,
        setFeedPage,
        feedHasMore,
        setFeedHasMore,
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
