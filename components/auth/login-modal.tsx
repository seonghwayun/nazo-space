"use client";

import { X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  if (!isOpen) return null;

  return (
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
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-bold">로그인 필요</h2>
          <p className="text-sm text-muted-foreground">
            리뷰나 평점을 남기시려면 로그인이 필요합니다.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onLogin} className="w-full" size="lg">
            로그인 하러가기
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
