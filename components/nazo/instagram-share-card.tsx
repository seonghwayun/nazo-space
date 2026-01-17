"use client";

import { INazo } from "@/models/nazo";
import Image from "next/image";
import { ForwardedRef, forwardRef } from "react";

interface InstagramShareCardProps {
  nazo: INazo;
  readyImageUrl?: string | null;
  dominantColor?: string;
  onImageLoad?: () => void;
}

export const InstagramShareCard = forwardRef(({ nazo, readyImageUrl, dominantColor, onImageLoad }: InstagramShareCardProps, ref: ForwardedRef<HTMLDivElement>) => {
  // Default dark reddish color if no dominant color provided
  const baseColor = dominantColor || '#2A0F0F';
  const gradientInner = dominantColor ? dominantColor : '#4A1F1F';
  const gradientOuter = '#000000'; // Always fade to black/dark for contrast

  return (
    <div
      ref={ref}
      className="w-[1080px] h-[1920px] relative flex items-center justify-center font-sans overflow-hidden"
      id="instagram-share-card-root"
      style={{
        width: '1080px',
        height: '1920px',
        background: `radial-gradient(circle at center, ${gradientInner} 0%, ${gradientOuter} 100%)`,
        // fallbacks to ensure no 'bg-...' class triggers lab() in computed styles
        backgroundColor: baseColor,
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
            box-shadow: 0 40px 80px -12px rgba(0, 0, 0, 0.6) !important;
        }
      `}</style>
      <div
        id="instagram-share-card-inner"
        className="w-[850px] rounded-[40px] overflow-hidden relative flex flex-col"
        style={{
          backgroundColor: '#1a1a1a',
        }}
      >
        {/* Artwork Area - Fixed height 4:5 ratio-ish to fit nicely */}
        <div className="w-full h-[1000px] relative overflow-hidden bg-black">
          {/* Layer 1: Blurred Background */}
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${readyImageUrl || nazo.imageUrl || `/api/image/${nazo._id}`})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.7)',
            }}
          />

          {/* Layer 2: Main Image - Contained */}
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <img
              src={readyImageUrl || nazo.imageUrl || `/api/image/${nazo._id}`}
              alt={nazo.originalTitle}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
              // crossOrigin="anonymous" // Removed for Base64 Data URLs to avoid strict CORS checks
              onLoad={(e) => {
                // Only signal load if we have the specific readyImageUrl (base64)
                if (readyImageUrl && onImageLoad) {
                  const img = e.currentTarget;
                  if ('decode' in img) {
                    img.decode()
                      .then(() => onImageLoad())
                      .catch(() => onImageLoad());
                  } else {
                    onImageLoad();
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Info Area - Centered & Enriched */}
        <div
          className="p-12 pt-10 flex flex-col items-center text-center relative z-10"
          style={{
            backgroundColor: baseColor, // Use dominant color base
            background: `linear-gradient(to bottom, ${baseColor} 0%, #1a1a1a 100%)`
          }}
        >
          {/* Title */}
          <h1
            className="text-[3.5rem] font-black mb-4 leading-tight tracking-tight text-white drop-shadow-lg"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            {nazo.originalTitle}
          </h1>

          {/* Creator */}
          <p
            className="text-2xl font-semibold mb-8 text-white/80"
          >
            {nazo.creators && nazo.creators.length > 0
              ? nazo.creators.map((c: any) => c.name).join(", ")
              : "Unknown Creator"}
          </p>

          {/* Stats / Metadata Row */}
          <div className="flex items-center gap-8 mb-10">
            {nazo.difficulty && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-white/50 text-sm uppercase tracking-wider font-bold">Difficulty</span>
                <span className="text-white text-xl font-bold">{nazo.difficulty}</span>
              </div>
            )}

            {nazo.estimatedTime && (
              <>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white/50 text-sm uppercase tracking-wider font-bold">Time</span>
                  <span className="text-white text-xl font-bold">{nazo.estimatedTime}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Branding */}
          <div className="mt-auto pt-6 border-t border-white/10 w-full flex justify-center">
            <span
              className="font-bold text-xl flex items-center gap-3 text-white/90"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
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
