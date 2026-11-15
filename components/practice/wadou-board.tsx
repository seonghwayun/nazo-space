import { arrowFor, type SpokePosition, type WadouPuzzle } from "@/lib/practice/wadou";
import { cn } from "@/lib/utils";

const CELL = "flex items-center justify-center";

function Kanji({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      lang="ja"
      className={cn(
        CELL,
        "size-16 sm:size-20 rounded-xl text-4xl sm:text-5xl font-medium",
        center ? "border-2 border-dashed border-primary/60 bg-primary/5" : "border bg-card shadow-sm"
      )}
    >
      {children}
    </div>
  );
}

function Arrow({ position, outerFirst }: { position: SpokePosition; outerFirst: boolean }) {
  return <div className={cn(CELL, "text-2xl text-muted-foreground")} aria-hidden>{arrowFor(position, outerFirst)}</div>;
}

/** The cross: four outer kanji, arrows in reading order, the center as ? until revealed. */
export function WadouBoard({ puzzle, revealed }: { puzzle: WadouPuzzle; revealed: boolean }) {
  const [top, left, right, bottom] = puzzle.spokes;
  return (
    <div
      className="grid grid-cols-5 grid-rows-5 gap-1 w-fit mx-auto place-items-center"
      role="img"
      aria-label={`위 ${top.kanji}, 왼쪽 ${left.kanji}, 오른쪽 ${right.kanji}, 아래 ${bottom.kanji}`}
    >
      <div className="col-start-3 row-start-1"><Kanji>{top.kanji}</Kanji></div>
      <div className="col-start-3 row-start-2"><Arrow position="top" outerFirst={top.outerFirst} /></div>
      <div className="col-start-1 row-start-3"><Kanji>{left.kanji}</Kanji></div>
      <div className="col-start-2 row-start-3"><Arrow position="left" outerFirst={left.outerFirst} /></div>
      <div className="col-start-3 row-start-3">
        <Kanji center>{revealed ? <span className="text-primary">{puzzle.answer}</span> : <span className="text-muted-foreground">?</span>}</Kanji>
      </div>
      <div className="col-start-4 row-start-3"><Arrow position="right" outerFirst={right.outerFirst} /></div>
      <div className="col-start-5 row-start-3"><Kanji>{right.kanji}</Kanji></div>
      <div className="col-start-3 row-start-4"><Arrow position="bottom" outerFirst={bottom.outerFirst} /></div>
      <div className="col-start-3 row-start-5"><Kanji>{bottom.kanji}</Kanji></div>
    </div>
  );
}
