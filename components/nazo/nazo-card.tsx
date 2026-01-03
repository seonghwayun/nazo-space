import Link from "next/link";
import Image from "next/image";
import { Star, Gauge, Clock } from "lucide-react";
import { INazo } from "@/models/nazo";

interface NazoCardProps {
  nazo: INazo;
}

export function NazoCard({ nazo }: NazoCardProps) {
  return (
    <Link href={`/nazo/${nazo._id}`} className="block h-full">
      <div className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent/50 transition-colors h-full">
        <div className="relative shrink-0 w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <Image
            src={nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            fill
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
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Rating Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-xs font-semibold">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span>
                {nazo.averageRate ? nazo.averageRate.toFixed(1) : "0.0"}
              </span>
            </div>

            {/* Difficulty Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-xs font-semibold">
              <Gauge className="w-3 h-3" />
              <span>{nazo.difficulty || "미정"}</span>
            </div>

            {/* Time Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
              <Clock className="w-3 h-3" />
              <span>{nazo.estimatedTime || "미정"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
