import { X, Copy, Check, Share2, Instagram, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INazo } from "@/models/nazo";
import { InstagramShareCard } from "./instagram-share-card";
import { toBlob } from "html-to-image";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  nazo?: INazo; // Make optional for backward compat but needed for Insta share
}

export function ShareModal({ isOpen, onClose, url, nazo }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyImageUrl, setReadyImageUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Clean up body scroll lock if needed, though radix dialog handles this usually.
  // Since this is a custom modal, we rely on parent or it handles itself.

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleInstagramShare = async () => {
    if (!nazo || !cardRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Pre-fetch image to avoid CORS issues in canvas
      // This is crucial for mobile Safari which is strict about cross-origin images in foreignObject
      const imgUrl = nazo.imageUrl || `/api/image/${nazo._id}`;

      try {
        // Use our own proxy to fetch the image same-origin
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Proxy fetch failed');

        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setReadyImageUrl(base64);
      } catch (e) {
        console.error("Failed to fetch image for processing", e);
        // Fallback to original url, might fail but worth a try (likely will fail on mobile if proxy failed)
        setReadyImageUrl(imgUrl);
      }

      // 2. Wait for the state to update and image to theoretically "render" with new source
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. Generate Blob
      // Mobile often fails on font embedding or huge images. 
      // We disable font embedding to be safe.
      const blob = await toBlob(cardRef.current, {
        cacheBust: false, // Don't append timestamps, breaks signed URLs
        skipAutoScale: true,
        pixelRatio: 1,
        fontEmbedCSS: '', // DISABLE FONT FETCHING
        filter: (node) => {
          // Exclude any cross-origin link tags if they sneak in
          if (node.tagName === 'LINK') return false;
          return true;
        }
      });

      if (!blob) {
        throw new Error("Blob generation returned null");
      }

      const file = new File([blob], "nazo-share.png", { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'NaZo Share',
        });
      } else {
        const link = document.createElement('a');
        link.download = 'nazo-story.png';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        alert("이미지가 저장되었습니다. 인스타그램 스토리에 직접 업로드해주세요!");
      }

    } catch (error: any) {
      console.error("Failed to generate image:", error);
      let errorMsg = error.message || error;
      if (typeof error === 'object' && error !== null) {
        try {
          // Attempt to dump object if it's an Event or generic object
          errorMsg = JSON.stringify(error, Object.getOwnPropertyNames(error));
          if (errorMsg === '{}') errorMsg = String(error);
        } catch (e) { }
      }
      alert(`이미지 생성 실패: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
      // setReadyImageUrl(null); // Keep it just in case user tries again
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm bg-background border border-border rounded-xl shadow-lg p-6 space-y-6 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center space-y-2 pt-2">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold">공유하기</h2>
            <p className="text-sm text-muted-foreground">
              아래 링크를 복사하여 친구들에게 공유해보세요.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            {/* Standard Link Copy */}
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  defaultValue={url}
                  readOnly
                  className="h-9"
                />
              </div>
              <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                <span className="sr-only">Copy</span>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Instagram Share Button */}
            {nazo && (
              <Button
                variant="outline"
                className="w-full gap-2 relative overflow-hidden group"
                onClick={handleInstagramShare}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    <span className="text-muted-foreground">생성 중...</span>
                  </>
                ) : (
                  <>
                    <Instagram className="h-4 w-4" />
                    <span>인스타그램 스토리로 공유</span>
                  </>
                )}
              </Button>
            )}

            <Button variant="ghost" onClick={onClose} className="w-full">
              닫기
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Render Area for Canvas Generation */}
      {nazo && (
        <div className="fixed top-0 left-0 w-[1080px] h-[1920px] pointer-events-none opacity-0 overflow-hidden z-[-1]">
          <InstagramShareCard ref={cardRef} nazo={nazo} readyImageUrl={readyImageUrl} />
        </div>
      )}
    </>
  );

}
