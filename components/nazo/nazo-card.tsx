import Link from "next/link";
import Image from "next/image";
import { Star, Gauge, Clock } from "lucide-react";
import { INazo } from "@/models/nazo";

interface NazoCardProps {
  nazo: INazo;
  myRate?: number;
}

export function NazoCard({ nazo, myRate }: NazoCardProps) {
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shadow-sm text-xs font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="font-semibold">
                {myRate !== undefined
                  ? myRate
                  : nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}
              </span>
              {myRate !== undefined && <span className="text-[10px] font-normal opacity-70 ml-px">(내 점수)</span>}
            </div>

            {/* Difficulty Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 shadow-sm text-xs font-medium">
              <Gauge className="w-3.5 h-3.5 text-rose-500" />
              <span>{nazo.difficulty || "미정"}</span>
            </div>

            {/* Time Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100 shadow-sm text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{nazo.estimatedTime || "미정"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
