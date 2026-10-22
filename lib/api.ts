import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Authed supabase client + user, or null. */
export async function getAuth(): Promise<{
  supabase: SupabaseClient;
  user: User;
} | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** Ensure a profile row exists for the user (first login). */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  roles: string[] = ["GUEST"],
) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      roles,
    });
  }
}

/** Fetch own profile. */
export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/* ---------- tiny in-memory rate limiter (per route+key, best effort) ---------- */

const buckets = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (b.n >= limit) return false;
  b.n++;
  return true;
}

export function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")
  );
}

export async function audit(
  supabase: SupabaseClient,
  userId: string | null,
  action: string,
  meta: Record<string, unknown> = {},
  ip: string | null = null,
) {
  try {
    await supabase.from("audit_log").insert({ user_id: userId, action, meta, ip });
  } catch {
    /* audit is best-effort */
  }
}
