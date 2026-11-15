"use client";

import { useEffect, useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { uploadImage } from "@/lib/upload-image";
import { imageSelectionError } from "@/lib/nazo-validation";
import {
  type NamedEntity,
  shouldOfferCreate,
  createCreatorByName,
  createTagByName,
} from "@/lib/inline-create";

export type NazoPayload = {
  /** Set when creating a nazo whose image was uploaded under a server-reserved id. */
  _id?: string;
  originalTitle: string;
  translatedTitle: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  estimatedTime: string;
  creators: string[];
  tags: string[];
};

interface NazoFormValues {
  originalTitle: string;
  translatedTitle: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  estimatedTime: string;
  creators: NamedEntity[];
  tags: NamedEntity[];
}

interface NazoFormProps {
  title: string;
  /** Existing nazo with populated `creators` and `tags` (edit mode). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  /** Throw to show an error and keep the input. */
  onSubmit: (payload: NazoPayload) => Promise<void>;
  onCancel: () => void;
}

const FORM_ID = "nazo-form";
const CREATOR_MIN_QUERY = 2;
const TAG_MIN_QUERY = 1;

function toValues(initialData?: NazoFormProps["initialData"]): NazoFormValues {
  return {
    originalTitle: initialData?.originalTitle || "",
    translatedTitle: initialData?.translatedTitle || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    difficulty: initialData?.difficulty ? String(initialData.difficulty) : "",
    estimatedTime: initialData?.estimatedTime || "",
    creators: initialData?.creators || [],
    tags: initialData?.tags || [],
  };
}

/**
 * Debounced search against an endpoint returning `{ results: NamedEntity[] }`.
 * `resultsFor` is the query the current `results` belong to; responses for
 * queries the user has already moved past are dropped.
 */
function useEntitySearch(endpoint: string, query: string, minLength: number) {
  const [results, setResults] = useState<NamedEntity[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < minLength) {
      setResults([]);
      setResultsFor(q);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setResults(data.results || []);
        setResultsFor(q);
      } catch (error) {
        if (cancelled) return;
        console.error(`Failed to search ${endpoint}`, error);
        setResults([]);
        setResultsFor(""); // unknown state: never offer create on a failed search
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, query, minLength]);

  return {
    results,
    resultsFor,
    isSearching,
    clear: () => {
      setResults([]);
      setResultsFor("");
    },
  };
}

interface EntityPickerProps {
  label: string;
  placeholder: string;
  selected: NamedEntity[];
  query: string;
  onQueryChange: (q: string) => void;
  results: NamedEntity[];
  resultsFor: string;
  minLength: number;
  isSearching: boolean;
  isCreating: boolean;
  onAdd: (entity: NamedEntity) => void;
  onRemove: (id: string) => void;
  onCreate: (name: string) => void;
}

function EntityPicker({
  label,
  placeholder,
  selected,
  query,
  onQueryChange,
  results,
  resultsFor,
  minLength,
  isSearching,
  isCreating,
  onAdd,
  onRemove,
  onCreate,
}: EntityPickerProps) {
  const offerCreate = !isSearching && shouldOfferCreate(query, results, { minLength, resultsFor });
  const showDropdown = results.length > 0 || offerCreate || isCreating;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => onRemove(item._id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`${item.name} 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
            {results.map((item) => (
              <button
                key={item._id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => onAdd(item)}
              >
                {item.name}
              </button>
            ))}
            {(offerCreate || isCreating) && (
              <button
                type="button"
                disabled={isCreating}
                className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-accent flex items-center gap-2 border-t disabled:opacity-60"
                onClick={() => onCreate(query.trim())}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                &apos;{query.trim()}&apos; 새로 만들기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function NazoForm({ title, initialData, onSubmit, onCancel }: NazoFormProps) {
  const [values, setValues] = useState<NazoFormValues>(() => toValues(initialData));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [creatorQuery, setCreatorQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [creatingCreator, setCreatingCreator] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const creatorSearch = useEntitySearch("/api/creator/search", creatorQuery, CREATOR_MIN_QUERY);
  const tagSearch = useEntitySearch("/api/tag", tagQuery, TAG_MIN_QUERY);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const addCreator = (creator: NamedEntity) => {
    setValues((prev) =>
      prev.creators.some((c) => c._id === creator._id)
        ? prev
        : { ...prev, creators: [...prev.creators, creator] }
    );
    setCreatorQuery("");
    creatorSearch.clear();
  };

  const addTag = (tag: NamedEntity) => {
    setValues((prev) =>
      prev.tags.some((t) => t._id === tag._id) ? prev : { ...prev, tags: [...prev.tags, tag] }
    );
    setTagQuery("");
    tagSearch.clear();
  };

  // FormPageShell scrolls the error into view whenever it changes.
  const showError = (message: string) => setError(message);

  const handleCreateCreator = async (name: string) => {
    setCreatingCreator(true);
    setError(null);
    try {
      addCreator(await createCreatorByName(name));
    } catch (err) {
      showError(err instanceof Error ? err.message : "제작자 추가에 실패했습니다.");
    } finally {
      setCreatingCreator(false);
    }
  };

  const handleCreateTag = async (name: string) => {
    setCreatingTag(true);
    setError(null);
    try {
      addTag(await createTagByName(name));
    } catch (err) {
      showError(err instanceof Error ? err.message : "태그 추가에 실패했습니다.");
    } finally {
      setCreatingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const imageError = imageSelectionError({
      useFileUpload,
      hasFile: Boolean(file),
      imageUrl: values.imageUrl,
    });
    if (imageError) {
      showError(imageError);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      let imageUrl = values.imageUrl;
      let newNazoId: string | undefined;
      const existingId = initialData?._id ? String(initialData._id) : undefined;
      if (useFileUpload && file) {
        const uploaded = await uploadImage(file, existingId);
        imageUrl = uploaded.url;
        if (!existingId) newNazoId = uploaded.nazoId;
      }
      await onSubmit({
        ...(newNazoId ? { _id: newNazoId } : {}),
        originalTitle: values.originalTitle,
        translatedTitle: values.translatedTitle,
        description: values.description,
        imageUrl,
        difficulty: values.difficulty,
        estimatedTime: values.estimatedTime,
        creators: values.creators.map((c) => c._id),
        tags: values.tags.map((t) => t._id),
      });
    } catch (err) {
      console.error("Submit failed", err);
      showError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setIsSaving(false);
    }
    // On success the page navigates away; keep `isSaving` to block double submits.
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
          <label className="text-sm font-medium">Original Title</label>
          <Input
            name="originalTitle"
            value={values.originalTitle}
            onChange={handleChange}
            required
            placeholder="Enter title"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Translated Title</label>
          <Input
            name="translatedTitle"
            value={values.translatedTitle}
            onChange={handleChange}
            placeholder="Optional translated title"
          />
        </div>

        <EntityPicker
          label="Creators"
          placeholder="Search creators by name..."
          selected={values.creators}
          query={creatorQuery}
          onQueryChange={setCreatorQuery}
          results={creatorSearch.results}
          resultsFor={creatorSearch.resultsFor}
          minLength={CREATOR_MIN_QUERY}
          isSearching={creatorSearch.isSearching}
          isCreating={creatingCreator}
          onAdd={addCreator}
          onRemove={(id) =>
            setValues((prev) => ({ ...prev, creators: prev.creators.filter((c) => c._id !== id) }))
          }
          onCreate={handleCreateCreator}
        />

        <EntityPicker
          label="Tags"
          placeholder="Search tags by name..."
          selected={values.tags}
          query={tagQuery}
          onQueryChange={setTagQuery}
          results={tagSearch.results}
          resultsFor={tagSearch.resultsFor}
          minLength={TAG_MIN_QUERY}
          isSearching={tagSearch.isSearching}
          isCreating={creatingTag}
          onAdd={addTag}
          onRemove={(id) =>
            setValues((prev) => ({ ...prev, tags: prev.tags.filter((t) => t._id !== id) }))
          }
          onCreate={handleCreateTag}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Enter description"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Image</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setUseFileUpload(!useFileUpload)}
            >
              {useFileUpload ? "Use URL instead" : "Upload File instead"}
            </Button>
          </div>
          {useFileUpload ? (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isSaving}
            />
          ) : (
            <Input
              name="imageUrl"
              value={values.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {useFileUpload
              ? "Supported: .jpg, .png, .gif, .webp"
              : "Enter a direct URL to an image hosted elsewhere."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Input
              name="difficulty"
              value={values.difficulty}
              onChange={handleChange}
              placeholder="e.g. Easy, 5, Hard"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated Time</label>
            <Input
              name="estimatedTime"
              value={values.estimatedTime}
              onChange={handleChange}
              placeholder="e.g. 30 mins"
            />
          </div>
        </div>
      </form>
    </FormPageShell>
  );
}
