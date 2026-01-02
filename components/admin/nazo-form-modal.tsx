"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Creator {
  _id: string;
  name: string;
}

interface NazoFormData {
  originalTitle: string;
  translatedTitle: string;
  description: string;
  imageUrl: string;
  difficulty: number;
  estimatedTime: string;
  creators: Creator[];
}

interface NazoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  title?: string;
}

export function NazoFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Create New Nazo",
}: NazoFormModalProps) {
  const [formData, setFormData] = useState<NazoFormData>({
    originalTitle: "",
    translatedTitle: "",
    description: "",
    imageUrl: "",
    difficulty: 1,
    estimatedTime: "",
    creators: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Creator Search State
  const [creatorQuery, setCreatorQuery] = useState("");
  const [creatorResults, setCreatorResults] = useState<Creator[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          originalTitle: initialData.originalTitle || "",
          translatedTitle: initialData.translatedTitle || "",
          description: initialData.description || "",
          imageUrl: initialData.imageUrl || "",
          difficulty: initialData.difficulty || 1,
          estimatedTime: initialData.estimatedTime || "",
          creators: initialData.creators || [],
        });
      } else {
        // Reset for create mode
        setFormData({
          originalTitle: "",
          translatedTitle: "",
          description: "",
          imageUrl: "",
          difficulty: 1,
          estimatedTime: "",
          creators: [],
        });
      }
      setCreatorQuery("");
      setCreatorResults([]);
    }
  }, [isOpen, initialData]);

  // Creator Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (creatorQuery.trim().length > 1) {
        setIsSearchingCreators(true);
        try {
          const res = await fetch(`/api/creator/search?q=${encodeURIComponent(creatorQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setCreatorResults(data.results || []);
          }
        } catch (error) {
          console.error("Failed to search creators", error);
        } finally {
          setIsSearchingCreators(false);
        }
      } else {
        setCreatorResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [creatorQuery]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "difficulty" ? parseInt(value) || 0 : value,
    }));
  };

  const handleAddCreator = (creator: Creator) => {
    setFormData(prev => {
      if (prev.creators.some(c => c._id === creator._id)) return prev;
      return { ...prev, creators: [...prev.creators, creator] };
    });
    setCreatorQuery("");
    setCreatorResults([]);
  };

  const handleRemoveCreator = (creatorId: string) => {
    setFormData(prev => ({
      ...prev,
      creators: prev.creators.filter(c => c._id !== creatorId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Transform creators to array of IDs
      const payload = {
        ...formData,
        creators: formData.creators.map(c => c._id),
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Submit failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
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
            <label className="text-sm font-medium">Original Title</label>
            <Input
              name="originalTitle"
              value={formData.originalTitle}
              onChange={handleChange}
              required
              placeholder="Enter title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Creators</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.creators.map(creator => (
                <div key={creator._id} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  <span>{creator.name}</span>
                  <button type="button" onClick={() => handleRemoveCreator(creator._id)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative">
              <Input
                placeholder="Search creators by name..."
                value={creatorQuery}
                onChange={(e) => setCreatorQuery(e.target.value)}
              />
              {creatorResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {creatorResults.map(creator => (
                    <button
                      key={creator._id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleAddCreator(creator)}
                    >
                      {creator.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Translated Title</label>
            <Input
              name="translatedTitle"
              value={formData.translatedTitle}
              onChange={handleChange}
              placeholder="Optional translated title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty (1-10)</label>
              <Input
                type="number"
                name="difficulty"
                min={1}
                max={10}
                value={formData.difficulty}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Time</label>
              <Input
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                placeholder="e.g. 30 mins"
              />
            </div>
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
