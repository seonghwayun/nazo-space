"use client";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

/**
 * Resize (longest side <= 1600px) and re-encode an image as WebP in the browser.
 * GIFs are returned untouched to preserve animation. If the result is not
 * smaller than the original, the original file is returned.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  );

  // Some browsers silently fall back to PNG when WebP encoding is unsupported.
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
    return file;
  }
  return blob;
}

/** Compress an image and upload it to R2 via a presigned URL. Returns the public URL. */
export async function uploadImage(file: File): Promise<string> {
  const body = await compressImage(file);
  const contentType = body.type || file.type;

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, size: body.size }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Failed to get upload URL: ${error}`);
  }
  const { uploadUrl, publicUrl } = (await res.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body,
  });
  if (!put.ok) {
    throw new Error(`Upload failed: ${put.status} ${put.statusText}`);
  }

  return publicUrl;
}
