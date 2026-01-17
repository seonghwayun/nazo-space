"use client";

import { INazo } from "@/models/nazo";
import Image from "next/image";
import { ForwardedRef, forwardRef } from "react";

interface InstagramShareCardProps {
  nazo: INazo;
  readyImageUrl?: string | null;
}

export const InstagramShareCard = forwardRef(({ nazo, readyImageUrl }: InstagramShareCardProps, ref: ForwardedRef<HTMLDivElement>) => {
  return (
    <div
      ref={ref}
      className="w-[1080px] h-[1920px] relative flex items-center justify-center font-sans overflow-hidden"
      id="instagram-share-card-root"
      style={{
        width: '1080px',
        height: '1920px',
        background: `radial-gradient(circle at center, #4A1F1F 0%, #1A0505 100%)`,
        // fallbacks to ensure no 'bg-...' class triggers lab() in computed styles
        backgroundColor: '#2A0F0F',
        borderColor: 'transparent',
        outline: 'none',
      }}
    >
      <style>{`
        #instagram-share-card-root,
        #instagram-share-card-root *,
        #instagram-share-card-root *::before,
        #instagram-share-card-root *::after {
          border-color: rgba(0,0,0,0) !important;
          outline: none !important;
          outline-color: rgba(0,0,0,0) !important;
          box-shadow: none !important;
          text-decoration-color: rgba(0,0,0,0) !important;
          column-rule-color: rgba(0,0,0,0) !important;
        }
        /* Restore specific shadow for the inner card */
        #instagram-share-card-inner {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
      <div
        id="instagram-share-card-inner"
        className="w-[800px] rounded-3xl overflow-hidden relative"
        style={{
          backgroundColor: '#1E0505',
          // boxShadow is set via ID selector above to survive the purge
        }}
      >
        {/* Artwork */}
        <div className="w-full aspect-square relative">
          <img
            src={readyImageUrl || nazo.imageUrl || `/api/image/${nazo._id}`}
            alt={nazo.originalTitle}
            className="w-full h-full object-cover"
            // If using readyImageUrl (base64), crossOrigin isn't needed but harmless
            // If using remove url, it is needed.
            crossOrigin="anonymous"
          />
        </div>

        {/* Info Area */}
        <div
          className="p-10 pb-12"
          style={{ backgroundColor: '#1E0505' }}
        >
          <h1
            className="text-6xl font-black mb-4 line-clamp-2 leading-tight tracking-tight"
            style={{ color: '#ffffff' }}
          >
            {nazo.originalTitle}
          </h1>

          <div className="flex items-center justify-between">
            <p
              className="text-3xl font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {nazo.creators && nazo.creators.length > 0
                ? nazo.creators.map((c: any) => c.name).join(", ")
                : "Unknown Creator"}
            </p>
          </div>

          {/* Branding / Logo Area */}
          <div className="mt-12 flex items-center gap-4">
            <span
              className="font-bold text-2xl flex items-center gap-3"
              style={{ color: '#ffffff' }}
            >
              {/* Circle Icon */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}
              >N</div>
              Nazo Space
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

InstagramShareCard.displayName = "InstagramShareCard";
