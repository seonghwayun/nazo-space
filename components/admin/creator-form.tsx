"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormPageShell } from "@/components/layout/form-page-shell";

export type CreatorFormData = { name: string; url: string };

interface CreatorFormProps {
  title: string;
  initialData?: CreatorFormData;
  /** Throw to show an error and keep the input. */
  onSubmit: (data: CreatorFormData) => Promise<void>;
  onCancel: () => void;
}

const FORM_ID = "creator-form";

export function CreatorForm({ title, initialData, onSubmit, onCancel }: CreatorFormProps) {
  const [values, setValues] = useState<CreatorFormData>({
    name: initialData?.name || "",
    url: initialData?.url || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(values);
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
          <label className="text-sm font-medium">Name</label>
          <Input
            name="name"
            value={values.name}
            onChange={handleChange}
            required
            placeholder="Enter creator name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Profile URL</label>
          <Input
            name="url"
            value={values.url}
            onChange={handleChange}
            placeholder="https://example.com/profile"
          />
        </div>
      </form>
    </FormPageShell>
  );
}
