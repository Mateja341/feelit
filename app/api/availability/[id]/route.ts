import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** GET → { booked: [ranges], blocked: [ranges], prices: [rules] } for a property. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const client = (await import("@/lib/supabase/server")).createServerSupabaseClient();
  if (!client) return err("db unavailable", 500);
  const { id } = await ctx.params;
  const [blocks, bookings, rules] = await Promise.all([
    client
      .from("availability_blocks")
      .select("id,start_date,end_date,reason,booking_id")
      .eq("property_id", id),
    client
      .from("bookings")
      .select("check_in,check_out,status")
      .eq("property_id", id)
      .in("status", ["PENDING", "CONFIRMED"]),
    client
      .from("price_rules")
      .select("id,start_date,end_date,price,label")
      .eq("property_id", id),
  ]);
  return json({
    blocks: blocks.data ?? [],
    bookings: bookings.data ?? [],
    price_rules: rules.data ?? [],
  });
}

/** POST {start_date,end_date,reason} → host blocks dates (or unblocks with {unblock:id}). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  const prop = await supabase
    .from("properties")
    .select("id")
    .eq("id", id)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!prop.data) return err("not found", 404);
  const body = await req.json().catch(() => null);

  if (body?.unblock) {
    await supabase
      .from("availability_blocks")
      .delete()
      .eq("id", body.unblock)
      .eq("property_id", id)
      .eq("reason", "HOST_BLOCKED");
    return json({ ok: true });
  }

  const parsed = z
    .object({
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      price: z.number().optional(),
      label: z.string().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return err("invalid payload");
  if (parsed.data.price !== undefined) {
    await supabase.from("price_rules").insert({
      property_id: id,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      price: parsed.data.price,
      label: parsed.data.label || "custom",
    });
    return json({ ok: true, kind: "price_rule" });
  }
  const { error } = await supabase.from("availability_blocks").insert({
    property_id: id,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    reason: "HOST_BLOCKED",
  });
  if (error) return err(error.message, 500);
  return json({ ok: true });
}
