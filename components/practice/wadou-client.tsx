"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WadouBoard } from "@/components/practice/wadou-board";
import { isCorrect } from "@/lib/practice/grade";
import type { WadouPuzzle } from "@/lib/practice/wadou";
import { cn } from "@/lib/utils";

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; puzzle: WadouPuzzle };
type Result = "correct" | "gave-up" | null;

const SHAKE_MS = 350;

export function WadouClient() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [input, setInput] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [choicesShown, setChoicesShown] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPuzzle = useCallback(async () => {
    // A newer request replaces an older one; the older one never sets state.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoad({ state: "loading" });
    setInput("");
    setHintsShown(0);
    setChoicesShown(false);
    setResult(null);
    setShake(false);
    try {
      const res = await fetch("/api/practice/wadou", { signal: controller.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const puzzle = (await res.json()) as WadouPuzzle;
      if (!controller.signal.aborted) setLoad({ state: "ready", puzzle });
    } catch {
      if (!controller.signal.aborted) setLoad({ state: "error" });
    }
  }, []);

  useEffect(() => {
    fetchPuzzle();
    return () => abortRef.current?.abort();
  }, [fetchPuzzle]);

  const puzzle = load.state === "ready" ? load.puzzle : null;
  const revealed = result !== null;

  const submit = (answer: string) => {
    if (!puzzle || revealed) return;
    if (isCorrect(answer, puzzle.answer)) {
      setResult("correct");
      return;
    }
    // Cleared by a timer, not animationend: with reduced motion there is no animation.
    setShake(true);
    window.setTimeout(() => setShake(false), SHAKE_MS);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-screen-sm mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <BackButton className="h-12 w-12" iconClassName="h-8 w-8" />
        <div>
          <h1 className="text-xl font-bold">가운데 한자 찾기</h1>
          <p lang="ja" className="text-xs text-muted-foreground">和同開珎</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        가운데에 한자 한 글자를 넣어 화살표 방향으로 읽으면 네 단어가 됩니다. 들어갈 한자는?
      </p>

      {load.state === "loading" && <Skeleton className="h-72 w-full rounded-xl" />}

      {load.state === "error" && (
        <div className="rounded-xl border bg-card p-6 text-center space-y-3">
          <p className="text-sm">문제를 불러오지 못했어요</p>
          <Button variant="outline" onClick={fetchPuzzle}>다시 시도</Button>
        </div>
      )}

      {puzzle && (
        <>
          <WadouBoard puzzle={puzzle} revealed={revealed} />

          {!revealed && (
            <div className="space-y-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
              >
                <Input
                  ref={inputRef}
                  lang="ja"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter that confirms an IME conversion must not submit.
                    if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
                  }}
                  placeholder="한자 한 글자"
                  aria-label="답"
                  autoComplete="off"
                  className={cn("h-11 text-lg", shake && "animate-shake border-destructive")}
                />
                <Button type="submit" className="h-11 px-5">확인</Button>
              </form>

              {choicesShown && (
                <div className="grid grid-cols-4 gap-2">
                  {puzzle.choices.map((choice) => (
                    <Button
                      key={choice}
                      variant="outline"
                      lang="ja"
                      className="h-14 text-2xl"
                      onClick={() => submit(choice)}
                    >
                      {choice}
                    </Button>
                  ))}
                </div>
              )}

              {hintsShown > 0 && (
                <ul className="space-y-1 rounded-lg bg-secondary/50 p-3 text-sm">
                  {puzzle.hints.slice(0, hintsShown).map((hint, i) => (
                    <li key={i}>
                      <span className="text-muted-foreground">힌트 {i + 1}.</span> <span lang={i === 1 ? "ja" : undefined}>{hint}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" disabled={hintsShown >= puzzle.hints.length} onClick={() => setHintsShown((n) => n + 1)}>
                  힌트
                </Button>
                <Button variant="secondary" size="sm" disabled={choicesShown} onClick={() => setChoicesShown(true)}>
                  선택지 보기
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setResult("gave-up")}>
                  모르겠어요
                </Button>
              </div>
            </div>
          )}

          {revealed && (
            <div className="space-y-4">
              <p className={cn("text-center text-lg font-semibold", result === "correct" ? "text-primary" : "text-muted-foreground")}>
                {result === "correct" ? "정답!" : <>정답은 <span lang="ja">{puzzle.answer}</span></>}
              </p>
              <ul className="divide-y rounded-xl border bg-card">
                {puzzle.words.map((word) => (
                  <li key={word.expression} className="flex items-baseline gap-3 px-4 py-3">
                    <span lang="ja" className="text-2xl">
                      {word.ruby.map((seg, i) =>
                        seg.ruby ? (
                          <ruby key={i}>
                            {seg.base}
                            <rt className="text-[0.5em] text-muted-foreground">{seg.ruby}</rt>
                          </ruby>
                        ) : (
                          <span key={i}>{seg.base}</span>
                        )
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">{word.meaning}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full h-11" onClick={fetchPuzzle}>다음 문제</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
