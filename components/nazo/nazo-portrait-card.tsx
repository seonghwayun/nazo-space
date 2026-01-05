import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { INazo } from "@/models/nazo";
import { cn } from "@/lib/utils";

interface NazoPortraitCardProps {
  nazo: INazo;
  rank?: number; // Optional rank badge (e.g., 1, 2, 3)
  hideRating?: boolean;
  className?: string;
}

export function NazoPortraitCard({ nazo, rank, hideRating, className }: NazoPortraitCardProps) {
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
            <div className="flex items-center gap-1 text-sm text-yellow-600 px-0.5">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span>{nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}</span>
              <span className="text-muted-foreground ml-0.5 text-xs">({nazo.rateCount || 0})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
