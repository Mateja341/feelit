import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json, rateLimit } from "@/lib/api";

const BUCKETS = ["property-photos", "user-photos", "property-media", "private-docs"] as const;

/**
 * POST {bucket, filename} → signed upload URL (path starts with user id
 * so storage RLS scopes objects to their owner).
 */
export async function POST(req: NextRequest) {
  if (!rateLimit("upload:sign", 30, 60_000)) return err("rate limited", 429);
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({
      bucket: z.enum(BUCKETS),
      filename: z.string().min(1).max(200),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const safe = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safe}`;
  const { data, error } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUploadUrl(path);
  if (error) return err(error.message, 500);
  const { data: pub } = supabase.storage
    .from(parsed.data.bucket)
    .getPublicUrl(path);
  return json({ path, signed_url: data.signedUrl, token: data.token, public_url: pub.publicUrl });
}

/** GET ?bucket=&path= → short-lived signed READ url (private docs only). */
export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const bucket = req.nextUrl.searchParams.get("bucket") ?? "";
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (bucket !== "private-docs" || !path.startsWith(`${user.id}/`))
    return err("not allowed", 403);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300);
  if (error) return err(error.message, 500);
  return json({ signed_url: data.signedUrl });
}
