"use client";

import * as React from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error";
interface ToastState { id: number; message: string; kind: ToastKind }

const ToastContext = React.createContext<(message: string, kind?: ToastKind) => void>(() => {});

/** Small bottom toast, used instead of alert() for save / delete results. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback((message: string, kind: ToastKind = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[200] flex justify-center px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        {toast && (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2",
              toast.kind === "success" ? "bg-foreground text-background" : "bg-destructive text-white"
            )}
          >
            {toast.kind === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
