import { cache } from "react";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";
import { notFound } from "next/navigation";
import NazoDetailPage from "./client-page";
import { Metadata } from "next";
import { isObjectIdHex } from "@/lib/image-key";
import { nazoDescription, nazoTitle, shareMeta } from "@/lib/seo";

// Ensure models are registered
const _ = { Creator, Tag };

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const getNazo = cache(async (id: string) => {
  // A malformed id would make findById throw (a 500) instead of a 404.
  if (!isObjectIdHex(id)) return null;
  await connectToDatabase();
  return Nazo.findById(id).populate("creators").populate("tags").lean();
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const nazo = await getNazo(id);

  // Throwing here (not only in the page) makes crawlers get a real 404 status:
  // the page body streams after loading.tsx, when the status is already 200.
  if (!nazo) notFound();

  const seo = {
    ...nazo,
    creators: (nazo.creators ?? []) as unknown as { name: string }[],
    tags: (nazo.tags ?? []) as unknown as { name: string }[],
  };
  const title = nazoTitle(seo);
  const description = nazoDescription(seo);
  return {
    title,
    description,
    ...shareMeta({ title, description, path: `/nazo/${id}`, image: nazo.imageUrl }),
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const nazo = await getNazo(id);

  if (!nazo) {
    notFound();
  }

  // Serialize Mongoose document to plain object for Client Component
  const serializedNazo = {
    ...nazo,
    _id: nazo._id.toString(),
    creators: nazo.creators?.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
    })),
    tags: nazo.tags?.map((t: any) => (typeof t === 'object' ? {
      ...t,
      _id: t._id.toString(),
    } : t)),
    createdAt: nazo.createdAt?.toISOString(),
    updatedAt: nazo.updatedAt?.toISOString(),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": nazo.originalTitle,
    "alternateName": nazo.translatedTitle || undefined,
    "url": `https://nazo.respace.cc/nazo/${id}`,
    "image": nazo.imageUrl ? [nazo.imageUrl] : [],
    "description": nazo.description,
    "aggregateRating": (nazo.rateCount || 0) > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": nazo.averageRate,
      "reviewCount": nazo.rateCount
    } : undefined,
    "author": nazo.creators?.map((c: any) => ({
      "@type": "Person",
      "name": c.name
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NazoDetailPage initialNazo={serializedNazo as any} />
    </>
  );
}
