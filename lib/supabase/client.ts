"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client for auth and realtime. Returns null when the
 * NEXT_PUBLIC_SUPABASE_* env vars are not configured so the UI can degrade
 * gracefully instead of crashing.
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
