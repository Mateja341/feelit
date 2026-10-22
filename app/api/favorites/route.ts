import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json, rateLimit } from "@/lib/api";

/** GET → { ids: string[] } of favorited properties. POST → toggle. */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return json({ ids: [] });
  const { supabase, user } = auth;
  const { data } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id);
  return json({ ids: (data ?? []).map((r) => r.property_id) });
}

export async function POST(req: NextRequest) {
  if (!rateLimit("fav:toggle", 30, 60_000)) return err("rate limited", 429);
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({ property_id: z.string() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const pid = parsed.data.property_id;

  const { data: existing } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("property_id", pid)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", pid);
    return json({ favorited: false });
  }
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, property_id: pid });
  if (error) return err(error.message, 500);
  return json({ favorited: true });
}
