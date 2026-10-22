"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type UploadBucket =
  | "property-photos"
  | "user-photos"
  | "property-media"
  | "private-docs";

/**
 * Uploads a file to Supabase Storage via a signed URL.
 * Returns { path, public_url } (public_url only for public buckets).
 */
export async function uploadFile(
  bucket: UploadBucket,
  file: File,
): Promise<{ path: string; public_url: string }> {
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, filename: file.name }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "upload failed");
  const { token, path, public_url } = await res.json();
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("supabase not configured");
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file);
  if (error) throw new Error(error.message);
  return { path, public_url };
}
