"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { INazo } from "@/models/nazo";
import { ICreator } from "@/models/creator";
import { ITag } from "@/models/tag";

/** A creator / tag row: name plus how many nazos it has and a few posters. */
export type WithNazoStats<T> = T & { nazoCount?: number; posters?: { _id: string; imageUrl?: string }[] };

export interface SearchResults {
  nazos: INazo[];
  creators: WithNazoStats<ICreator>[];
  tags: WithNazoStats<ITag>[];
  /** Total matches per tab (from the first page of a search). */
  counts?: { nazo: number; creator: number; tag: number };
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
  // Feed options (kept here so they survive back navigation)
  feedSort: FeedSort;
  setFeedSort: (sort: FeedSort) => void;
  feedUnplayedOnly: boolean;
  setFeedUnplayedOnly: (v: boolean) => void;
  layout: "list" | "grid";
  setLayout: (layout: "list" | "grid") => void;
}

export type FeedSort = "new" | "rate" | "popular";

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ nazos: [], creators: [], tags: [] });
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  // Feed State
  const [feedNazos, setFeedNazos] = useState<INazo[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedSort, setFeedSort] = useState<FeedSort>("new");
  const [feedUnplayedOnly, setFeedUnplayedOnly] = useState(false);
  const [layout, setLayout] = useState<"list" | "grid">("list");

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
        feedSort,
        setFeedSort,
        feedUnplayedOnly,
        setFeedUnplayedOnly,
        layout,
        setLayout,
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
