import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Hash, User } from "lucide-react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface NamedRowProps {
  href: string;
  kind: "creator" | "tag";
  name: string;
  nazoCount?: number;
  posters?: { _id: string; imageUrl?: string }[];
  onClick?: () => void;
}

/** A creator or tag in search: icon, name, nazo count and up to three posters. */
export function NamedRow({ href, kind, name, nazoCount, posters = [], onClick }: NamedRowProps) {
  const Icon = kind === "creator" ? User : Hash;
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        {nazoCount !== undefined && <span className="text-xs text-muted-foreground">나조 {nazoCount}개</span>}
      </span>
      {posters.length > 0 && (
        <span className="flex shrink-0 -space-x-3" aria-hidden>
          {posters.map((p) => (
            <span key={p._id} className="relative aspect-[2/3] w-8 overflow-hidden rounded border-2 border-card bg-muted">
              <Image src={p.imageUrl || `/api/image/${p._id}`} alt="" fill sizes="32px" className="object-cover" />
            </span>
          ))}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function NamedRowSkeleton({ kind }: { kind: "creator" | "tag" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3" aria-hidden>
      <Skeleton className={kind === "creator" ? "h-10 w-10 shrink-0 rounded-full" : "h-10 w-10 shrink-0 rounded-full"} />
      <span className="min-w-0 flex-1">
        <SkeletonText className="font-medium" barClassName="w-1/3" />
        <SkeletonText className="text-xs" barClassName="w-14" />
      </span>
      <span className="flex shrink-0 -space-x-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[2/3] w-8 rounded border-2 border-card" />
        ))}
      </span>
      <span className="h-4 w-4 shrink-0" />
    </div>
  );
}
