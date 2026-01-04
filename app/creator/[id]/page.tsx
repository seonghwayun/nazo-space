import { MainLayout } from "@/components/layout/main-layout";
import { BackButton } from "@/components/ui/back-button";
import connectToDatabase from "@/lib/db";
import Creator from "@/models/creator";
import Nazo from "@/models/nazo";
import { NazoCard } from "@/components/nazo/nazo-card";
import { ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CreatorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { id } = await params;
  await connectToDatabase();

  const creator = await Creator.findById(id);

  if (!creator) {
    notFound();
  }

  // Fetch Nazos created by this creator
  const createdNazos = await Nazo.find({ creators: id })
    .sort({ createdAt: -1 }) // Newest first
    .lean();

  // Serializing necessary fields to pass to Client Components if needed, 
  // but Server Components can render them directly. 
  // NazoCard expects INazo which is a mongoose document or plain object.
  // We should convert to plain objects to avoid serialization warnings if they traverse boundaries,
  // designating NazoCard as client component or props. 
  // NazoCard is likely a client component (it has interactive elements or is just presentation).
  // Mongoose lean() returns POJO.

  return (
    <MainLayout padded>
      <div className="flex flex-col gap-8">
        <div className="flex items-center">
          <BackButton
            className="!h-14 !w-14 rounded-full"
            iconClassName="!h-10 !w-10"
          />
        </div>
        {/* Creator Header */}
        <div className="flex flex-col gap-4 items-start p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">
              👤
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{creator.name}</h1>
              <p className="text-sm text-muted-foreground">
                총 {createdNazos.length}개의 나조를 제작했습니다.
              </p>
            </div>
          </div>

          {creator.url && (
            <div className="mt-2">
              <Link href={creator.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  홈페이지 방문
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Created Nazos List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1">제작한 나조</h2>
          {createdNazos.length > 0 ? (
            <div className="flex flex-col gap-4">
              {createdNazos.map((nazo) => (
                <div key={nazo._id.toString()}>
                  <NazoCard nazo={itemToNazo(nazo)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
              제작한 나조가 없습니다.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Helper to cast lean result to INazo-like interface if needed by Typescript
function itemToNazo(item: any) {
  return {
    ...item,
    _id: item._id.toString(),
    creators: item.creators?.map((c: any) => c.toString()),
    tags: item.tags?.map((t: any) => t.toString()),
    // Ensure all dates/ObjectIds are strings if NazoCard requires it, 
    // or just pass as is if NazoCard handles it. 
    // NazoCard expects INazo. If lean() is used, _id is ObjectId.
    // Ideally we cast or transform.
  };
}
