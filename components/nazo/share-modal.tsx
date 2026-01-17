import { X, Copy, Check, Share2, Instagram, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INazo } from "@/models/nazo";
import { InstagramShareCard } from "./instagram-share-card";
import { toBlob } from "html-to-image";
import { FastAverageColor } from 'fast-average-color';

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
  const [dominantColor, setDominantColor] = useState<string>('#2A0F0F');
  const imageLoadedRef = useRef(false); // Use ref for live tracking in async loop
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile environment
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/android/i.test(userAgent)) return true;
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return true;
      return false;
    };
    setIsMobile(checkMobile());
  }, []);

  // Clean up body scroll lock if needed, though radix dialog handles this usually.
  // Since this is a custom modal, we rely on parent or it handles itself.

  // Reset state when closing/opening
  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setReadyImageUrl(null);
      imageLoadedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      alert("링크가 복사되었습니다! 인스타그램 스토리 '링크' 스티커에 붙여넣으세요.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleInstagramShare = async () => {
    if (!nazo) return; // Removed cardRef.current check here because it's initially null
    setIsGenerating(true);
    imageLoadedRef.current = false;
    setReadyImageUrl(null); // Force reset to ensure onLoad fires again on change
    await new Promise(r => setTimeout(r, 50)); // Small tick to allow render cycle

    try {
      // 1. Pre-fetch image via Proxy
      const imgUrl = nazo.imageUrl || `/api/image/${nazo._id}`;
      let base64Image = '';

      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Proxy fetch failed');

        const blob = await response.blob();

        // Extract Color from Blob
        try {
          const fac = new FastAverageColor();
          const bitmap = await createImageBitmap(blob);
          const color = fac.getColor(bitmap);
          setDominantColor(color.hex);
        } catch (colorErr) {
          console.warn("Color extraction failed, using default", colorErr);
        }

        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // CRITICAL FIX: Explicitly decode the image in browser memory BEFORE mounting the component.
        // This ensures the browser has parsed the Base64 and is ready to paint it immediately.
        const preLoader = new Image();
        preLoader.src = base64Image;
        await preLoader.decode().catch(e => console.warn("Pre-decode failed, continuing anyway", e));

        setReadyImageUrl(base64Image);
      } catch (e) {
        console.error("Failed to fetch image for processing", e);
        setReadyImageUrl(imgUrl); // Fallback
      }

      // 2. Wait for Card Mount AND Image Load
      // First, wait for cardRef to exist (it mounts after setReadyImageUrl)
      let mountAttempts = 0;
      while (!cardRef.current && mountAttempts < 20) {
        await new Promise(r => setTimeout(r, 50));
        mountAttempts++;
      }
      if (!cardRef.current) throw new Error("Share card failed to mount");

      // Then wait for the image to actually load in the DOM
      // We rely on the child component calling the onLoad callback which updates our ref
      let attempts = 0;
      // Wait until ref becomes true. We need a small delay inside loop to yield execution.
      while (!imageLoadedRef.current && attempts < 50) { // 50 * 100ms = 5 seconds max
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      // Extra buffer for rendering (gradients, fonts)
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Double Capture Strategy (Warm-up + Final)
      // First, run a "Warm-up" capture. This forces the browser to engage the rendering pipeline, 
      // load fonts, and paint images, even if the result is blank or incomplete.
      try {
        await toBlob(cardRef.current, {
          cacheBust: false, skipAutoScale: true, pixelRatio: 1, fontEmbedCSS: '',
          filter: (node) => node.tagName !== 'LINK'
        });
      } catch (e) {
        console.warn("Warm-up capture failed (expected)", e);
      }

      // Short delay after warm-up
      await new Promise(resolve => setTimeout(resolve, 200));

      // Now proceed to the "Real" capture with retry logic
      let blob: Blob | null = null;
      let captureAttempts = 0;

      while (!blob && captureAttempts < 3) {
        try {
          const generatedBlob = await toBlob(cardRef.current, {
            cacheBust: false,
            skipAutoScale: true,
            pixelRatio: 1,
            fontEmbedCSS: '',
            filter: (node) => node.tagName !== 'LINK'
          });

          if (generatedBlob && generatedBlob.size > 50000) {
            blob = generatedBlob;
          } else {
            console.warn(`Generated blob too small (${generatedBlob?.size} bytes). Retrying...`);
            await new Promise(r => setTimeout(r, 500));
          }
        } catch (err) {
          console.warn("Capture attempt failed", err);
          await new Promise(r => setTimeout(r, 500));
        }
        captureAttempts++;
      }

      if (!blob) {
        throw new Error("Failed to generate valid image after retries.");
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
      // Check for user cancellation (AbortError is standard for Web Share API)
      if (error.name === 'AbortError' || error.message?.toLowerCase().includes('cancel')) {
        alert("사용자가 공유를 취소했습니다.");
        return;
      }

      console.error("Failed to generate image:", error);
      alert(`이미지 생성 실패: ${error.message || error}`);
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
            {/* Native App Share Button - Only visible on Mobile */}
            {/* Mobile Share Buttons */}
            {nazo && isMobile && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 relative overflow-hidden group h-12"
                  onClick={handleInstagramShare} // Sends Image
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                      <span className="text-muted-foreground w-max leading-none">..</span>
                    </>
                  ) : (
                    <>
                      <Instagram className="h-4 w-4" />
                      <span className="text-xs">인스타그램 (이미지)</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-12"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: nazo.originalTitle,
                        text: `${nazo.originalTitle} - Nazo Space`,
                        url: window.location.href, // Sends Link Only for Cards
                      });
                    } catch (err: any) {
                      if (err.name !== 'AbortError') alert("공유 실패");
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">X / 카카오 (링크)</span>
                </Button>
              </div>
            )}

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

            <Button variant="ghost" onClick={onClose} className="w-full">
              닫기
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Render Area for Canvas Generation */}
      {/* Hidden Render Area for Canvas Generation */}
      {/* Fix: Only mount the card when readyImageUrl is set. 
          This forces a fresh mount with the correct base64 image, ensuring onLoad fires reliably. */}
      {/* Fix: Only mount the card when readyImageUrl is set. 
          This forces a fresh mount with the correct base64 image, ensuring onLoad fires reliably. */}
      {nazo && readyImageUrl && (
        <div className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] overflow-hidden z-[-1] visible">
          <InstagramShareCard
            key={readyImageUrl} // CRITICAL: Force full re-mount when image changes
            ref={cardRef}
            nazo={nazo}
            readyImageUrl={readyImageUrl}
            dominantColor={dominantColor}
            onImageLoad={() => {
              imageLoadedRef.current = true;
            }}
          />
        </div>
      )}
    </>
  );

}
