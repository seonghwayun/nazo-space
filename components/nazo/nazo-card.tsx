import Link from "next/link";
import Image from "next/image";
import { Star, Gauge, Clock } from "lucide-react";
import { INazo } from "@/models/nazo";
import { PlayedStamp } from "@/components/nazo/played-stamp";
import type { MyNazoLog } from "@/hooks/use-play-logs";

interface NazoCardProps {
  nazo: INazo;
  myRate?: number;
  /** The viewer's own record: a PLAYED stamp / 쌓아둠 badge and their rating. */
  myLog?: MyNazoLog;
}

export function NazoCard({ nazo, myRate, myLog }: NazoCardProps) {
  return (
    <Link href={`/nazo/${nazo._id}`} className="block h-full min-w-0">
      <div className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent/50 transition-colors h-full">
        <div className="relative shrink-0 w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <Image
            src={nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            fill
            sizes="80px"
            className="object-cover"
          />
          {myLog?.status === "played" && <PlayedStamp size="xs" className="absolute bottom-1 right-1" />}
          {myLog?.status === "unplayed" && (
            <span className="absolute bottom-1 left-1 rounded bg-marker/90 px-1 text-[9px] font-semibold text-slate-900">쌓아둠</span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-lg truncate leading-tight">
            {nazo.originalTitle}
          </h3>
          {nazo.translatedTitle && (
            <p className="text-sm text-muted-foreground truncate">
              {nazo.translatedTitle}
            </p>
          )}

          {/* Metric Badges */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {/* Rating Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border shadow-sm text-xs font-medium">
              <Star className="w-3.5 h-3.5 fill-star text-star" />
              <span className="font-semibold">
                {myRate !== undefined
                  ? myRate
                  : nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}
              </span>
              {myRate !== undefined && <span className="text-[10px] font-normal opacity-70 ml-px">(내 점수)</span>}
            </div>

            {myLog?.rate ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-star/40 bg-star/10 text-xs font-semibold">
                <span className="text-muted-foreground font-normal">내 별점</span>
                <Star className="w-3 h-3 fill-star text-star" />
                {myLog.rate.toFixed(1)}
              </div>
            ) : null}

            {/* Difficulty Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border shadow-sm text-xs font-medium">
              <Gauge className="w-3.5 h-3.5 text-stamp" />
              <span>{nazo.difficulty || "미정"}</span>
            </div>

            {/* Time Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border shadow-sm text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{nazo.estimatedTime || "미정"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
