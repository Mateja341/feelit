import { type NextRequest } from "next/server";
import { z } from "zod";
import { audit, err, getAuth, getProfile, json } from "@/lib/api";
import { propertySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function ownProperty(supabase: any, userId: string, id: string) {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("host_id", userId)
    .maybeSingle();
  return data;
}

/** GET → one property (owner gets full row; public gets published only). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await getAuth();
  const supabase = auth?.supabase;
  const client = supabase ?? (await import("@/lib/supabase/server")).createServerSupabaseClient();
  if (!client) return err("db unavailable", 500);
  const { data } = await client
    .from("properties")
    .select(
      "*, property_photos(id,url,position,is_cover), property_media(id,kind,url,status), price_rules(id,start_date,end_date,price,label)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return err("not found", 404);
  if (data.status !== "PUBLISHED" && data.host_id !== auth?.user.id)
    return err("not found", 404);
  return json({ property: data });
}

/** PATCH → update fields or status transitions (publish/pause/duplicate). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  const prop = await ownProperty(supabase, user.id, id);
  if (!prop) return err("not found", 404);

  const body = await req.json().catch(() => null);
  const action = z
    .enum(["publish", "pause", "unpause", "submit_review"])
    .safeParse(body?.action);
  if (action.success) {
    const profile = await getProfile(supabase, user.id);
    const { data: hp } = await supabase
      .from("host_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (action.data === "publish" || action.data === "submit_review") {
      if (hp?.verification_status !== "VERIFIED")
        return err("host verification required before publishing", 403);
      const photos = await supabase
        .from("property_photos")
        .select("id", { count: "exact", head: true })
        .eq("property_id", id);
      if ((photos.count ?? 0) < 1)
        return err("add at least one photo before publishing", 422);
      const status =
        action.data === "publish" ? "PUBLISHED" : "PENDING_REVIEW";
      await supabase.from("properties").update({ status }).eq("id", id);
      await audit(supabase, user.id, `property_${action.data}`, { id });
      return json({ ok: true, status });
    }
    const status = action.data === "pause" ? "PAUSED" : "PUBLISHED";
    await supabase.from("properties").update({ status }).eq("id", id);
    return json({ ok: true, status });
  }

  const parsed = propertySchema.partial().safeParse(body);
  if (!parsed.success) return err("invalid payload");
  const { error } = await supabase
    .from("properties")
    .update(parsed.data)
    .eq("id", id);
  if (error) return err(error.message, 500);
  return json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  const prop = await ownProperty(supabase, user.id, id);
  if (!prop) return err("not found", 404);
  const active = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("property_id", id)
    .in("status", ["PENDING", "CONFIRMED"])
    .gte("check_out", new Date().toISOString().slice(0, 10));
  if ((active.count ?? 0) > 0)
    return err("cannot delete a property with active bookings — pause it instead", 422);
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return err(error.message, 500);
  return json({ ok: true });
}
