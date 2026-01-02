"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreatorFormData {
  name: string;
  url: string;
}

interface CreatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatorFormData) => Promise<void>;
  title?: string;
}

export function CreatorFormModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Create New Creator",
}: CreatorFormModalProps) {
  const [formData, setFormData] = useState<CreatorFormData>({
    name: "",
    url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({ name: "", url: "" });
    } catch (error) {
      console.error("Submit failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter creator name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Profile URL</label>
            <Input
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com/profile"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
