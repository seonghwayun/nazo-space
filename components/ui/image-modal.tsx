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
      <DialogContent showCloseButton={false} overlayClassName="bg-black/90" className="w-fit h-fit p-0 bg-transparent border-none shadow-none max-w-none outline-none">
        <VisuallyHidden><DialogTitle>Image View</DialogTitle></VisuallyHidden>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={imageUrl}
            alt={alt}
            className="max-w-[95vw] max-h-[80vh] object-contain rounded-md shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
