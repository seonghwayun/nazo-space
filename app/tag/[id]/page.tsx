import { MainLayout } from "@/components/layout/main-layout";
import { BackButton } from "@/components/ui/back-button";
import connectToDatabase from "@/lib/db";
import Tag from "@/models/tag";
import Nazo from "@/models/nazo";
import { NazoCard } from "@/components/nazo/nazo-card";
import { notFound } from "next/navigation";

import { Metadata } from "next";
import { cache } from "react";
import { isObjectIdHex } from "@/lib/image-key";
import { listDescription, nazoDisplayTitle, shareMeta } from "@/lib/seo";

interface TagPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Shared by generateMetadata and the page (one query each per request).
const getTag = cache(async (id: string) => {
  // A malformed id would make findById throw (a 500) instead of a 404.
  if (!isObjectIdHex(id)) return null;
  await connectToDatabase();
  return Tag.findById(id);
});
const getNazos = cache(async (id: string) =>
  Nazo.find({ tags: id }).sort({ createdAt: -1 }).lean()
);

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { id } = await params;
  const tag = await getTag(id);
  if (!tag) notFound();

  const nazos = await getNazos(id);
  const title = `#${tag.name} - 나조토키 태그`;
  const description = listDescription("tag", tag.name, nazos.map((n) => nazoDisplayTitle(n)));
  return {
    title,
    description,
    ...shareMeta({
      title,
      description,
      path: `/tag/${id}`,
      image: nazos.find((n) => n.imageUrl)?.imageUrl,
      poster: true,
    }),
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { id } = await params;
  const tag = await getTag(id);

  if (!tag) {
    notFound();
  }

  // Fetch Nazos associated with this tag
  const taggedNazos = await getNazos(id);

  return (
    <MainLayout padded>
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <BackButton
            className="!h-14 !w-14 rounded-full"
            iconClassName="!h-10 !w-10"
          />
        </div>

        {/* Tag Header */}
        <div className="flex flex-col gap-4 items-start p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl">
              #
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{tag.name}</h1>
              <p className="text-sm text-muted-foreground">
                총 {taggedNazos.length}개의 나조가 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Tagged Nazos List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1">관련 나조</h2>
          {taggedNazos.length > 0 ? (
            <div className="flex flex-col gap-4">
              {taggedNazos.map((nazo) => (
                <div key={nazo._id.toString()}>
                  <NazoCard nazo={itemToNazo(nazo)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
              관련된 나조가 없습니다.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Helper to cast lean result to INazo-like interface
function itemToNazo(item: any) {
  return {
    ...item,
    _id: item._id.toString(),
    creators: item.creators?.map((c: any) => c.toString()),
    tags: item.tags?.map((t: any) => t.toString()),
  };
}
