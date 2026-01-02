"use client";

import React, { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRate?: number;
  initialReview?: string;
  onSave: (rate: number, review: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  title?: string;
}

export function RatingModal({
  isOpen,
  onClose,
  initialRate = 0,
  initialReview = "",
  onSave,
  onRemove,
  title = "Rate this content",
}: RatingModalProps) {
  const [rate, setRate] = useState(initialRate);
  const [hoverRate, setHoverRate] = useState<number | null>(null);
  const [review, setReview] = useState(initialReview);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRate(initialRate || 0);
      setReview(initialReview || "");
    }
  }, [isOpen, initialRate, initialReview]);

  if (!isOpen) return null;

  const displayRate = hoverRate !== null ? hoverRate : rate;

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    const value = starIndex + (isHalf ? 0.5 : 1);
    setRate(value);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    const value = starIndex + (isHalf ? 0.5 : 1);
    setHoverRate(value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(rate, review);
      onClose();
    } catch (error) {
      console.error("Failed to save rating:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setIsRemoving(true);
    try {
      await onRemove();
      onClose();
    } catch (error) {
      console.error("Failed to remove rating:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-background border border-border rounded-xl shadow-lg p-6 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="text-3xl font-bold text-primary h-10 flex items-center justify-center">
            {displayRate > 0 ? displayRate.toFixed(1) : "Not rated"}
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {[0, 1, 2, 3, 4].map((index) => {
            const fill = Math.max(0, Math.min(1, displayRate - index));

            return (
              <div
                key={index}
                className="relative cursor-pointer w-10 h-10"
                onMouseLeave={() => setHoverRate(null)}
              >
                {/* Background Star (Gray) */}
                <Star className="absolute inset-0 w-full h-full text-muted-foreground/30 fill-muted-foreground/30" />

                {/* Foreground Star (Yellow/Primary) - Clipped */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                </div>

                {/* Interaction Layers */}
                <div
                  className="absolute inset-y-0 left-0 w-1/2 z-10"
                  onClick={() => handleStarClick(index, true)}
                  onMouseEnter={() => handleStarHover(index, true)}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/2 z-10"
                  onClick={() => handleStarClick(index, false)}
                  onMouseEnter={() => handleStarHover(index, false)}
                />
              </div>
            )
          })}
        </div>

        {/* Optional Review Textarea could go here if needed, but keeping it simple for now as per prompt "small modal" */}

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isSaving || isRemoving}
          >
            {isSaving ? "Saving..." : "Save Rating"}
          </Button>
          {onRemove && initialRate > 0 && (
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleRemove}
              disabled={isSaving || isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Rating"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
