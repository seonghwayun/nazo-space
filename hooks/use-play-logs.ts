"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import type { LogEntry, PlayStatus } from "@/lib/play-log";

export interface PlayLogSummary extends LogEntry {
  status: PlayStatus;
  playedAt: string | null;
  createdAt: string;
  hasReview: boolean;
  nazo: {
    _id: string;
    originalTitle: string;
    translatedTitle?: string;
    imageUrl?: string;
    averageRate?: number;
    rateCount?: number;
    estimatedTime?: string;
    difficulty?: string;
  };
}

/** What a nazo card shows about the viewer's own record. */
export interface MyNazoLog {
  status: PlayStatus;
  rate: number | null;
}

/** nazoId → the viewer's record, for marking cards in lists. */
export function myLogsById(logs: PlayLogSummary[]): Map<string, MyNazoLog> {
  return new Map(logs.map((l) => [l.nazoId, { status: l.status, rate: l.rate ?? null }]));
}

/** The signed-in user's play logs (GET /api/log/me). Empty and not loading when signed out. */
export function usePlayLogs() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = React.useState<PlayLogSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const reload = React.useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/log/me", { cache: "no-store" });
      if (res.ok) setLogs((await res.json()).logs ?? []);
    } catch (error) {
      console.error("Failed to fetch play logs", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    if (status === "loading") return;
    if (!userId) {
      setLogs([]);
      setIsLoading(false);
      return;
    }
    reload();
  }, [status, userId, reload]);

  return { logs, isLoading: status === "loading" || isLoading, reload, isSignedIn: !!userId, isSessionLoading: status === "loading" };
}
