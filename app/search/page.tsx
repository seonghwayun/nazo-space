"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/main-layout";
import { Search, Loader2, LayoutGrid, List, History, X, ArrowDownUp, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { NazoPortraitCard } from "@/components/nazo/nazo-portrait-card";
import { cn } from "@/lib/utils";
import type { FeedSort } from "@/contexts/search-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchContext } from "@/contexts/search-context";
import { NazoCard } from "@/components/nazo/nazo-card";
import { NazoCardSkeleton } from "@/components/nazo/nazo-card-skeleton";
import { NazoPortraitCardSkeleton } from "@/components/nazo/nazo-portrait-card-skeleton";
import { INazo } from "@/models/nazo";
import { NamedRow, NamedRowSkeleton } from "@/components/search/named-row";
import { usePlayLogs, myLogsById, type MyNazoLog } from "@/hooks/use-play-logs";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SearchResults } from "@/contexts/search-context";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Suspense } from "react";

const TABS = [
  { key: "nazo", label: "나조" },
  { key: "creator", label: "제작자" },
  { key: "tag", label: "태그" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
type SearchCounts = Record<TabKey, number>;

const SORT_LABELS: Record<FeedSort, string> = {
  new: "최근 등록순",
  rate: "평점 높은순",
  popular: "평가 많은순",
};

function SearchContent() {
  const {
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
  } = useSearchContext();
  const { data: session } = useSession();
  const { logs } = usePlayLogs();
  const myLogs = React.useMemo(() => myLogsById(logs), [logs]);
  const { recent, remember, forget, clear: clearRecent } = useRecentSearches();

  // Sort and filter shared by the feed and search results ("안 해본 것만" needs a session).
  const unplayedOnly = !!session && feedUnplayedOnly;
  const filterQS = React.useMemo(() => {
    const params = new URLSearchParams({ sort: feedSort });
    if (unplayedOnly) params.set("unplayedOnly", "1");
    return params.toString();
  }, [feedSort, unplayedOnly]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "nazo";
  const activeTabRef = React.useRef(activeTab);
  activeTabRef.current = activeTab;

  // Rewrite one query param, keeping the others (tab ↔ q). router.replace lands a moment
  // later, so remember the query we last asked for until the URL catches up; otherwise
  // two quick updates (switch tab, then type) would undo each other.
  const requestedQSRef = React.useRef<string | null>(null);
  const currentQS = React.useCallback(() => requestedQSRef.current ?? window.location.search.slice(1), []);
  React.useEffect(() => {
    if (requestedQSRef.current === searchParams.toString()) requestedQSRef.current = null;
  }, [searchParams]);
  const replaceParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(currentQS());
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      requestedQSRef.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, currentQS]
  );
  const handleTabChange = (tab: TabKey) => replaceParam("tab", tab === "nazo" ? null : tab);

  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // The search term lives in ?q= so refresh, back and shared links keep it.
  // A ?q= in the URL wins on arrival; otherwise the term kept in context
  // (e.g. coming back through the bottom nav) is written into the URL.
  const urlQuery = searchParams.get("q") ?? "";
  const pendingUrlQueryRef = React.useRef<string | null>(urlQuery && urlQuery !== query ? urlQuery : null);
  React.useEffect(() => {
    if (pendingUrlQueryRef.current !== null) setQuery(pendingUrlQueryRef.current);
    // Arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const pending = pendingUrlQueryRef.current;
    if (pending !== null) {
      if (debouncedQuery !== pending) return; // still applying the URL's term
      pendingUrlQueryRef.current = null;
    }
    if (debouncedQuery !== query) return; // still typing
    const trimmed = debouncedQuery.trim();
    if (trimmed !== (new URLSearchParams(currentQS()).get("q") ?? "")) replaceParam("q", trimmed || null);
  }, [debouncedQuery, query, replaceParam, currentQS]);

  // Search Pagination State
  const [searchPages, setSearchPages] = React.useState({ nazo: 1, creator: 1, tag: 1 });
  const [searchHasMore, setSearchHasMore] = React.useState({ nazo: true, creator: true, tag: true });
  const [isMoreLoading, setIsMoreLoading] = React.useState(false);

  // Feed State (for empty query) - Now from Context
  const [isFeedLoading, setIsFeedLoading] = React.useState(false);
  // A next page was asked for and its fetch has not finished yet. Scroll events arrive faster
  // than the loading state re-renders, so this ref keeps one scroll from asking twice.
  const loadMorePendingRef = React.useRef(false);
  const loadMoreRef = React.useRef<() => void>(() => {}); // set below, once the state it reads exists

  // Feed Fetch Logic
  // Track the last page we successfully requested to prevent duplicate fetches on tab switch
  const lastFetchedPages = React.useRef({ nazo: 1, creator: 1, tag: 1 });

  // Scroll Restoration
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const restoreScrollRef = React.useRef(false);
  const saveScrollTimeoutRef = React.useRef<NodeJS.Timeout>(null);
  const SEARCH_SCROLL_KEY = "nazo-search-scroll-pos";

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const el = e.currentTarget;
    // Ask for the next page a little before the last card scrolls in.
    if (el.scrollHeight - scrollTop - el.clientHeight <= 400) loadMoreRef.current();
    if (saveScrollTimeoutRef.current) clearTimeout(saveScrollTimeoutRef.current);
    saveScrollTimeoutRef.current = setTimeout(() => {
      sessionStorage.setItem(SEARCH_SCROLL_KEY, scrollTop.toString());
    }, 100);
  }, []);

  // Restore scroll
  React.useEffect(() => {
    // We try to restore when not loading and we have some content (or at least initial load done)
    const hasContent = (activeTab === "nazo" && feedNazos.length > 0) ||
      (results.nazos.length > 0) ||
      (results.creators.length > 0) ||
      (results.tags.length > 0);

    if (!isLoading && !restoreScrollRef.current) {
      // Warning: for Feed, we only have page 1 initially on refresh/back unless context changes.
      // But for Search Results, we have them from context.
      // We attempt restoration anyway.
      const savedPos = sessionStorage.getItem(SEARCH_SCROLL_KEY);
      if (savedPos && scrollContainerRef.current) {
        try {
          const scrollTop = parseInt(savedPos, 10);
          if (!isNaN(scrollTop)) {
            scrollContainerRef.current.scrollTo({ top: scrollTop, behavior: 'instant' });
          }
        } catch (e) { }
      }
      restoreScrollRef.current = true;
    }
  }, [isLoading, results, feedNazos, activeTab]);

  // Ignore feed responses that belong to an older sort / filter.
  const feedRequestRef = React.useRef(0);
  const feedKey = filterQS;

  const fetchFeed = React.useCallback(async (pageNum: number) => {
    const requestId = ++feedRequestRef.current;
    setIsFeedLoading(true);
    try {
      const params = new URLSearchParams(filterQS);
      params.set("page", String(pageNum));
      params.set("limit", "20");
      const res = await fetch(`/api/nazo?${params}`);
      const data = await res.json();
      if (requestId !== feedRequestRef.current) return;
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
      if (requestId === feedRequestRef.current) {
        setIsFeedLoading(false);
        loadMorePendingRef.current = false;
      }
    }
  }, [filterQS, setFeedNazos, setFeedHasMore]);

  // Sort / filter changed: start the feed over (the initial-load effect below fetches page 1).
  const lastFeedKeyRef = React.useRef(feedKey);
  React.useEffect(() => {
    if (lastFeedKeyRef.current === feedKey) return;
    lastFeedKeyRef.current = feedKey;
    setFeedNazos([]);
    setFeedPage(1);
    setFeedHasMore(true);
    loadMorePendingRef.current = false;
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [feedKey, setFeedNazos, setFeedPage, setFeedHasMore]);

  // In-flight "load more" request; aborted when a new search starts or the page unmounts,
  // so a stale page never lands on top of newer results.
  const moreAbortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => moreAbortRef.current?.abort(), []);

  // Search More Fetch Logic
  const fetchMoreSearch = React.useCallback(async (type: "nazo" | "creator" | "tag", pageNum: number) => {
    moreAbortRef.current?.abort();
    const controller = new AbortController();
    moreAbortRef.current = controller;
    setIsMoreLoading(true);
    try {
      const params = new URLSearchParams(filterQS);
      params.set("q", debouncedQuery);
      params.set("type", type);
      params.set("page", String(pageNum));
      const res = await fetch(`/api/nazo/search?${params}`, { signal: controller.signal });
      const data = await res.json();
      if (controller.signal.aborted) return;

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
      if (controller.signal.aborted) return;
      console.error("Failed to load more search results:", error);
    } finally {
      if (moreAbortRef.current === controller) {
        moreAbortRef.current = null;
        setIsMoreLoading(false);
        loadMorePendingRef.current = false;
      }
    }
  }, [debouncedQuery, filterQS, setResults]);


  // Infinite scroll (feed and search results). The next page is asked for from the scroll
  // position the user actually reached, not from an IntersectionObserver: the observer is
  // re-created after every load and reports the end-of-list marker as visible right away
  // whenever the browser keeps it on screen (scroll anchoring, iOS momentum / bounce), which
  // loaded page after page with no further scrolling.
  loadMoreRef.current = () => {
    if (loadMorePendingRef.current) return;
    if (debouncedQuery) {
      if (searchHasMore[activeTab] && !isMoreLoading && !isLoading) {
        loadMorePendingRef.current = true;
        setSearchPages((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
      }
    } else if (activeTab === "nazo" && feedHasMore && !isFeedLoading && feedNazos.length > 0) {
      loadMorePendingRef.current = true;
      setFeedPage((prev) => prev + 1);
    }
  };

  // A list too short to scroll never fires a scroll event, so fill it up to the screen.
  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && !isFeedLoading && !isMoreLoading && !isLoading && el.scrollHeight <= el.clientHeight) {
      loadMoreRef.current();
    }
  }, [feedNazos.length, results, activeTab, isFeedLoading, isMoreLoading, isLoading]);

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


  // A search is identified by its term and the filters, so changing a filter searches again.
  const searchKey = debouncedQuery ? `${debouncedQuery}\u0000${filterQS}` : "";

  // Effect: Initial Search Load (Reset)
  // A newer term or filter aborts the request for the previous one (effect cleanup below).
  React.useEffect(() => {
    const controller = new AbortController();
    async function fetchInitialResults() {
      // Logic from useDebounce means debouncedQuery updates slightly later
      // We check if it matches last searched or if empty
      if (searchKey === lastSearchedQuery && searchKey) return;

      // Pages of the previous search must not be appended to the new one.
      moreAbortRef.current?.abort();
      loadMorePendingRef.current = false;

      if (!debouncedQuery) {
        setResults({ nazos: [], creators: [], tags: [] });
        setLastSearchedQuery("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Reset Pages and HasMore
      setSearchPages({ nazo: 1, creator: 1, tag: 1 });
      lastFetchedPages.current = { nazo: 1, creator: 1, tag: 1 };
      setSearchHasMore({ nazo: true, creator: true, tag: true });

      try {
        const params = new URLSearchParams(filterQS);
        params.set("q", debouncedQuery);
        const response = await fetch(`/api/nazo/search?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        setResults(data);

        // Initialize HasMore from the totals (fall back to "a full first page").
        setSearchHasMore({
          nazo: data.counts ? data.nazos.length < data.counts.nazo : data.nazos.length >= 20,
          creator: data.counts ? data.creators.length < data.counts.creator : data.creators.length >= 20,
          tag: data.counts ? data.tags.length < data.counts.tag : data.tags.length >= 20,
        });

        // Nothing in the open tab but hits elsewhere: open the first tab that has some.
        const counts = data.counts as SearchCounts | undefined;
        if (counts && counts[activeTabRef.current] === 0) {
          const next = TABS.find((t) => counts[t.key] > 0);
          if (next) replaceParam("tab", next.key === "nazo" ? null : next.key);
        }

      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to search:", error);
      } finally {
        // An aborted search leaves loading state to the search that replaced it.
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setLastSearchedQuery(searchKey);
        }
      }
    }

    fetchInitialResults();
    return () => controller.abort();
  }, [searchKey]); // Intentionally minimal deps

  const isSearching = query.length > 0 && (
    query !== debouncedQuery ||
    isLoading ||
    searchKey !== lastSearchedQuery
  );

  // Browse lists for the 제작자 / 태그 tabs when there is no search term.
  const [browse, setBrowse] = React.useState<Partial<Pick<SearchResults, "creators" | "tags">>>({});
  const browseKey = activeTab === "creator" ? "creators" : activeTab === "tag" ? "tags" : null;
  const needsBrowse = !query && browseKey !== null && browse[browseKey] === undefined;
  React.useEffect(() => {
    if (!needsBrowse || !browseKey) return;
    const controller = new AbortController();
    fetch(`/api/nazo/search?type=${activeTab}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) setBrowse((prev) => ({ ...prev, [browseKey]: data[browseKey] ?? [] }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error("Failed to load browse list:", error);
      });
    return () => controller.abort();
  }, [needsBrowse, browseKey, activeTab]);

  // The ✕ in the search box: back to the feed right away instead of waiting for the debounce.
  // Tab, sort and filters stay as they are.
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const clearSearch = () => {
    moreAbortRef.current?.abort();
    setQuery("");
    setResults({ nazos: [], creators: [], tags: [] });
    replaceParam("q", null);
    scrollContainerRef.current?.scrollTo({ top: 0 });
    searchInputRef.current?.focus();
  };

  // Remember a term once it was actually used: Enter, or opening a result.
  const rememberQuery = () => {
    if (query.trim()) remember(query);
  };

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
              ref={searchInputRef}
              type="search"
              placeholder="검색어를 입력하세요..."
              className="pl-9 pr-9 w-full bg-background [&::-webkit-search-cancel-button]:appearance-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) rememberQuery();
                else if (e.key === "Escape" && query) clearSearch();
              }}
              enterKeyHint="search"
            />
            {query && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex" role="tablist">
            {TABS.map((t) => {
              const count = debouncedQuery && !isSearching ? results.counts?.[t.key] : undefined;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  className={cn(
                    "flex-1 pb-3 text-sm font-medium transition-colors relative",
                    activeTab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleTabChange(t.key)}
                >
                  {t.label}
                  {count !== undefined && (
                    <span className={cn("ml-1 tabular-nums", count === 0 ? "text-muted-foreground/60" : "text-primary")}>
                      {count > 999 ? "999+" : count}
                    </span>
                  )}
                  {activeTab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
        {activeTab === "nazo" && (
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-2.5 flex items-center gap-2 border-t">
            <div className="flex items-center gap-1.5 flex-1 min-w-0" role="group" aria-label="정렬과 필터">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`정렬: ${SORT_LABELS[feedSort]}`}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full border bg-card pl-2.5 pr-2 text-[13px] font-semibold"
                  >
                    <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                    {SORT_LABELS[feedSort]}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-36">
                  <DropdownMenuRadioGroup value={feedSort} onValueChange={(v) => setFeedSort(v as FeedSort)}>
                    {(Object.keys(SORT_LABELS) as FeedSort[]).map((key) => (
                      <DropdownMenuRadioItem key={key} value={key}>
                        {SORT_LABELS[key]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {session && (
                <Chip active={feedUnplayedOnly} onClick={() => setFeedUnplayedOnly(!feedUnplayedOnly)}>
                  안 해본 것만
                </Chip>
              )}
            </div>
            <div className="flex shrink-0 rounded-lg border overflow-hidden" role="group" aria-label="보기 방식">
              <button
                type="button"
                aria-label="리스트로 보기"
                aria-pressed={layout === "list"}
                onClick={() => setLayout("list")}
                className={cn("h-8 w-9 grid place-items-center", layout === "list" ? "bg-secondary text-foreground" : "text-muted-foreground")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="포스터로 보기"
                aria-pressed={layout === "grid"}
                onClick={() => setLayout("grid")}
                className={cn("h-8 w-9 grid place-items-center", layout === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content Area (Full Width) */}
      {/* No scroll anchoring: when you are at the very bottom the browser anchors to the
          infinite-scroll sentinel and, as a page is appended above it, scrolls along to keep
          it on screen, so every page would immediately request the next one. */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full min-h-0 [overflow-anchor:none]"
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {isSearching ? (
            <div className="grid grid-cols-1 gap-4">
              {activeTab === "nazo" ? (
                <NazoResultsSkeleton layout={layout} />
              ) : (
                [1, 2, 3, 4, 5].map((i) => <NamedRowSkeleton key={i} kind={activeTab} />)
              )}
            </div>
          ) : currentList?.length > 0 ? (
            <div className={activeTab === "nazo" ? "grid gap-4" : "grid gap-2"} onClickCapture={rememberQuery}>
              {activeTab === "nazo" && <NazoResults nazos={results.nazos} layout={layout} myLogs={myLogs} />}

              {activeTab === "creator" &&
                results.creators.map((c) => (
                  <NamedRow key={String(c._id)} kind="creator" href={`/creator/${c._id}`} name={c.name} nazoCount={c.nazoCount} posters={c.posters} />
                ))}

              {activeTab === "tag" &&
                results.tags.map((t) => (
                  <NamedRow key={String(t._id)} kind="tag" href={`/tag/${t._id}`} name={t.name} nazoCount={t.nazoCount} posters={t.posters} />
                ))}

              {/* Load More Indicator */}
              {isMoreLoading && (
                <div className="py-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Infinite Scroll Anchor */}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">&ldquo;{query}&rdquo;에 대한 {activeTab === "nazo" ? "나조" : activeTab === "creator" ? "제작자" : "태그"} 검색 결과가 없습니다.</p>
            </div>
          ) : activeTab === "nazo" ? (
            /* Feed View for Nazo */
            <div className="grid gap-4">
              <RecentSearches recent={recent} onPick={setQuery} onForget={forget} onClear={clearRecent} />
              {feedNazos.length > 0 && <NazoResults nazos={feedNazos} layout={layout} myLogs={myLogs} />}
              {!isFeedLoading && !feedHasMore && feedNazos.length === 0 && (
                <p className="py-10 text-center text-muted-foreground">
                  {feedUnplayedOnly ? "아직 안 해본 나조가 없어요." : "등록된 나조가 없습니다."}
                </p>
              )}
              {isFeedLoading && <NazoResultsSkeleton layout={layout} />}
            </div>
          ) : (
            /* Browse every creator / tag */
            <div className="grid gap-2">
              <RecentSearches recent={recent} onPick={setQuery} onForget={forget} onClear={clearRecent} />
              <p className="text-xs font-semibold text-muted-foreground px-1">
                {activeTab === "creator" ? "모든 제작자" : "모든 태그"} · 나조 많은 순
              </p>
              {browseKey && browse[browseKey]
                ? browse[browseKey]!.map((row) => (
                    <NamedRow
                      key={String(row._id)}
                      kind={activeTab === "creator" ? "creator" : "tag"}
                      href={`/${activeTab}/${row._id}`}
                      name={row.name}
                      nazoCount={row.nazoCount}
                      posters={row.posters}
                    />
                  ))
                : [1, 2, 3, 4, 5, 6].map((i) => <NamedRowSkeleton key={i} kind={activeTab === "creator" ? "creator" : "tag"} />)}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors",
        active ? "bg-foreground text-background border-foreground font-semibold" : "bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/** Loading placeholder shaped like the current layout (poster grid or card list). */
function NazoResultsSkeleton({ layout }: { layout: "list" | "grid" }) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-5">
        {Array.from({ length: 12 }, (_, i) => (
          <NazoPortraitCardSkeleton key={i} className="w-auto" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <NazoCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** "최근 검색": chips that refill the search box; hidden when there are none. */
function RecentSearches({
  recent,
  onPick,
  onForget,
  onClear,
}: {
  recent: string[];
  onPick: (term: string) => void;
  onForget: (term: string) => void;
  onClear: () => void;
}) {
  if (recent.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label="최근 검색">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <History className="h-3.5 w-3.5" /> 최근 검색
        </h2>
        <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
          전체 삭제
        </button>
      </div>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide">
        {recent.map((term) => (
          <span key={term} className="flex h-8 shrink-0 items-center rounded-full border bg-card text-[13px]">
            <button type="button" onClick={() => onPick(term)} className="h-full pl-3 pr-1.5">
              {term}
            </button>
            <button
              type="button"
              aria-label={`${term} 삭제`}
              onClick={() => onForget(term)}
              className="grid h-full w-7 place-items-center rounded-r-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}

function NazoResults({ nazos, layout, myLogs }: { nazos: INazo[]; layout: "list" | "grid"; myLogs: Map<string, MyNazoLog> }) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-5">
        {nazos.map((nazo) => (
          <NazoPortraitCard key={String(nazo._id)} nazo={nazo} className="w-auto" myLog={myLogs.get(String(nazo._id))} />
        ))}
      </div>
    );
  }
  return (
    <>
      {nazos.map((nazo) => (
        <NazoCard key={String(nazo._id)} nazo={nazo} myLog={myLogs.get(String(nazo._id))} />
      ))}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
