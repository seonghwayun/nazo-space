"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface FormPageShellProps {
  title: string;
  /** id of the <form> inside children; the 저장 button submits it. */
  formId: string;
  onCancel: () => void;
  isSaving: boolean;
  error?: string | null;
  children: React.ReactNode;
}

/** Full-screen form page: fixed `취소 | title | 저장` bar (same as the review page). */
export function FormPageShell({
  title,
  formId,
  onCancel,
  isSaving,
  error,
  children,
}: FormPageShellProps) {
  const errorRef = React.useRef<HTMLDivElement>(null);

  // The app scrolls an inner container (not window), so bring the error into view directly.
  React.useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  return (
    <div className="min-h-full bg-background">
      <div className="fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center justify-between px-4">
        <Button
          type="button"
          variant="ghost"
          className="text-base font-medium px-0 hover:bg-transparent text-foreground"
          onClick={onCancel}
        >
          취소
        </Button>
        <span className="text-base font-bold truncate px-2">{title}</span>
        <Button
          type="submit"
          form={formId}
          variant="ghost"
          className="text-base font-medium px-0 hover:bg-transparent text-primary"
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>

      <div className="h-14" />

      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-10">
        {error && (
          <div
            ref={errorRef}
            role="alert"
            className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
