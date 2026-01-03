"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  title: string;
}

export function TagFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
}: TagFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  if (!isOpen) return null;

  const onFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-background border border-border rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="tag-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                placeholder="Enter tag name"
                {...register("name", { required: "Tag name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message as string}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20 flex justify-end gap-2 rounded-b-xl">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="tag-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Tag
          </Button>
        </div>
      </div>
    </div>
  );
}
