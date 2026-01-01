"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ImageIcon, Loader2, PenTool } from "lucide-react";
import { INazo } from "@/models/nazo";

// Helper to generate a consistent pastel color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Hue: 0-360
  const h = Math.abs(hash % 360);
  // Saturation: 60-80% for vibrancy
  const s = 70;
  // Lightness: 85-95% for pastel background
  const l = 90;

  return `hsl(${h}, ${s}%, ${l}%)`;
}

export default function NazoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [nazo, setNazo] = useState<INazo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNazo() {
      if (!id) return;
      try {
        const res = await fetch(`/api/nazo/${id}`);
        if (!res.ok) throw new Error("Failed to fetch nazo");
        const data = await res.json();
        setNazo(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNazo();
  }, [id]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!nazo) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">Nazo not found.</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header with Back Button */}
        <div className="sticky top-0 z-10 flex items-center p-4 bg-background border-b shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()} // Go back to preserve history
            className="mr-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold truncate flex-1 min-w-0">
            {nazo.originalTitle}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto w-full p-4 space-y-6">
            {/* Image Section */}
            <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
              {nazo.imageUrl ? (
                <Image
                  src={nazo.imageUrl}
                  alt={nazo.originalTitle}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
              )}
            </div>

            {/* Title & Description & Creators */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold break-words">{nazo.originalTitle}</h2>
                {nazo.translatedTitle && (
                  <p className="text-muted-foreground text-lg">{nazo.translatedTitle}</p>
                )}
              </div>

              {/* Creators Section */}
              {nazo.creators && nazo.creators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(nazo.creators as any[]).map((creator) => {
                    const bgColor = stringToColor(creator._id || creator.name);
                    const Content = (
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-full transition-colors shadow-sm hover:brightness-95"
                        style={{ backgroundColor: bgColor, borderColor: 'transparent' }} // Override background
                      >
                        <div className="p-1 rounded-full bg-white/50">
                          <PenTool className="h-3 w-3 text-foreground/70" />
                        </div>
                        <span className="text-sm font-medium text-foreground/80">{creator.name}</span>
                      </div>
                    );

                    return creator.url ? (
                      <a
                        key={creator._id}
                        href={creator.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                      >
                        {Content}
                      </a>
                    ) : (
                      <div key={creator._id}>{Content}</div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tags */}
            {nazo.tags && nazo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nazo.tags.map((tag: any) => (
                  <span
                    key={tag._id}
                    className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Main Description */}
            {nazo.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{nazo.description}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {nazo.difficulty && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Difficulty</span>
                  <p className="font-medium">{nazo.difficulty} / 10</p>
                </div>
              )}
              {nazo.estimatedTime && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Est. Time</span>
                  <p className="font-medium">{nazo.estimatedTime}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
