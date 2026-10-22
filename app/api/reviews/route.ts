import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json } from "@/lib/api";

/** GET ?property=id → reviews. POST → guest reviews host (or host reviews guest) after stay. PATCH → host reply. */
export async function GET(req: NextRequest) {
  const client = (await import("@/lib/supabase/server")).createServerSupabaseClient();
  if (!client) return err("db unavailable", 500);
  const pid = req.nextUrl.searchParams.get("property");
  const mine = req.nextUrl.searchParams.get("mine");
  let q = client
    .from("reviews")
    .select("*, profiles!reviews_author_id_fkey(first_name,last_name)");
  if (pid) q = q.eq("property_id", pid);
  if (mine) {
    const auth = await getAuth();
    if (!auth) return err("unauthorized", 401);
    q = q.eq("author_id", auth.user.id);
  }
  const { data } = await q.order("created_at", { ascending: false });
  return json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({
      booking_id: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      text: z.string().max(2000).default(""),
      target: z.enum(["guest", "host"]).default("host"),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const { booking_id, rating, text, target } = parsed.data;

  const { data: bk } = await supabase
    .from("bookings")
    .select("*, properties(host_id)")
    .eq("id", booking_id)
    .maybeSingle();
  if (!bk) return err("booking not found", 404);
  const allowed =
    (target === "host" && bk.guest_id === user.id) ||
    (target === "guest" && bk.properties?.host_id === user.id);
  if (!allowed) return err("not your booking", 403);
  if (!["COMPLETED", "CONFIRMED"].includes(bk.status))
    return err("reviews open after the stay is confirmed", 422);

  const { error } = await supabase.from("reviews").upsert(
    {
      booking_id,
      property_id: bk.property_id,
      author_id: user.id,
      target,
      rating,
      text,
    },
    { onConflict: "booking_id,target" },
  );
  if (error) return err(error.message, 500);

  // refresh the property rating aggregate
  const { data: agg } = await supabase
    .from("reviews")
    .select("rating")
    .eq("property_id", bk.property_id)
    .eq("target", "host");
  if (agg?.length) {
    const avg = agg.reduce((s, r) => s + r.rating, 0) / agg.length;
    await supabase
      .from("properties")
      .update({ rating: Math.round(avg * 100) / 100 })
      .eq("id", bk.property_id);
  }
  return json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({ review_id: z.string().uuid(), reply: z.string().max(2000) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const { data: rv } = await supabase
    .from("reviews")
    .select("*, properties(host_id)")
    .eq("id", parsed.data.review_id)
    .maybeSingle();
  if (!rv || rv.properties?.host_id !== user.id)
    return err("not found", 404);
  await supabase
    .from("reviews")
    .update({ reply: parsed.data.reply })
    .eq("id", rv.id);
  return json({ ok: true });
}
