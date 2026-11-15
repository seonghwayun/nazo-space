"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormPageShell } from "@/components/layout/form-page-shell";

interface TagFormProps {
  title: string;
  /** Throw to show an error and keep the input. */
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
}

const FORM_ID = "tag-form";

export function TagForm({ title, onSubmit, onCancel }: TagFormProps) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim() });
    } catch (err) {
      console.error("Submit failed", err);
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setIsSaving(false);
    }
  };

  return (
    <FormPageShell
      title={title}
      formId={FORM_ID}
      onCancel={onCancel}
      isSaving={isSaving}
      error={error}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tag-name">Tag Name</Label>
          <Input
            id="tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter tag name"
          />
        </div>
      </form>
    </FormPageShell>
  );
}
