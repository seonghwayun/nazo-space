"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, alt = "Image" }: ImageModalProps) {
  // Prevent hydration issues usually handled by Dialog properly, but good to be safe with image loading
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/90"
        className="fixed inset-0 z-50 flex items-center justify-center w-[100dvw] h-[100dvh] max-w-none p-0 bg-transparent border-none shadow-none outline-none translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom-0"
        onClick={onClose}
      >
        <VisuallyHidden><DialogTitle>Image View</DialogTitle></VisuallyHidden>

        <div
          className="flex flex-col items-end gap-2 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={imageUrl}
            alt={alt}
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-md shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
