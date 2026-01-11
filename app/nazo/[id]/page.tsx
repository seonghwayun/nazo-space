import { cache } from "react";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";
import { notFound } from "next/navigation";
import NazoDetailPage from "./client-page";
import { Metadata } from "next";

// Ensure models are registered
const _ = { Creator, Tag };

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const getNazo = cache(async (id: string) => {
  await connectToDatabase();
  return Nazo.findById(id).populate("creators").populate("tags").lean();
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const nazo = await getNazo(id);

  if (!nazo) {
    return {
      title: "나조를 찾을 수 없음 | Nazo Space",
    };
  }

  return {
    title: `${nazo.originalTitle} | Nazo Space`,
    description: nazo.description ? nazo.description.slice(0, 150) + "..." : "나조 상세 정보",
    openGraph: {
      title: `${nazo.originalTitle} | Nazo Space`,
      description: nazo.description ? nazo.description.slice(0, 150) + "..." : "나조 상세 정보",
      images: nazo.imageUrl ? [nazo.imageUrl] : [],
    },
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
