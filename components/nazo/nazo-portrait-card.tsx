import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { INazo } from "@/models/nazo";
import { cn } from "@/lib/utils";
import { PlayedStamp } from "@/components/nazo/played-stamp";
import type { MyNazoLog } from "@/hooks/use-play-logs";

interface NazoPortraitCardProps {
  nazo: INazo;
  rank?: number; // Optional rank badge (e.g., 1, 2, 3)
  hideRating?: boolean;
  className?: string;
  /** The viewer's own record: a PLAYED stamp / 쌓아둠 badge and their rating. */
  myLog?: MyNazoLog;
}

export function NazoPortraitCard({ nazo, rank, hideRating, className, myLog }: NazoPortraitCardProps) {
  return (
    <Link href={`/nazo/${nazo._id}`} className={cn("block group w-[160px] flex-none", className)}>
      <div className="space-y-2">
        {/* Image Container */}
        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border bg-muted shadow-sm group-hover:shadow-md transition-all">
          <Image
            src={nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            fill
            sizes="160px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {myLog?.status === "played" && <PlayedStamp size="sm" className="absolute top-2 right-1.5" />}
          {myLog?.status === "unplayed" && (
            <span className="absolute top-1.5 left-1.5 rounded bg-marker/90 px-1.5 py-px text-[10px] font-semibold text-slate-900">쌓아둠</span>
          )}
          {rank && (
            <div className="absolute left-2 bottom-2 bg-black/60 text-white text-lg font-bold px-2 py-0.5 rounded backdrop-blur-sm">
              {rank}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="font-medium text-base leading-tight truncate px-0.5">
            {nazo.originalTitle}
          </h3>
          {!hideRating && (
            <div className="flex items-center gap-1 text-sm text-foreground/80 px-0.5">
              <Star className="w-3.5 h-3.5 fill-star text-star" />
              <span>{nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}</span>
              {myLog?.rate ? (
                <span className="ml-0.5 truncate text-xs font-semibold text-star">· 내 {myLog.rate.toFixed(1)}</span>
              ) : (
                <span className="text-muted-foreground ml-0.5 text-xs">({nazo.rateCount || 0})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
