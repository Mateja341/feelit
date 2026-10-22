import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** POST {url, is_cover?} → add photo row (file already uploaded to storage). */
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

  const parsed = z
    .object({ url: z.string().min(1), is_cover: z.boolean().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");

  if (parsed.data.is_cover) {
    await supabase
      .from("property_photos")
      .update({ is_cover: false })
      .eq("property_id", id);
  }
  const max = await supabase
    .from("property_photos")
    .select("position")
    .eq("property_id", id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("property_photos")
    .insert({
      property_id: id,
      url: parsed.data.url,
      position: (max.data?.position ?? -1) + 1,
      is_cover: parsed.data.is_cover ?? false,
    })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ photo: data });
}

/** PATCH {id, position?, is_cover?} or {order: [ids]} reorder. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
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

  if (Array.isArray(body?.order)) {
    await Promise.all(
      (body.order as string[]).map((photoId, i) =>
        supabase
          .from("property_photos")
          .update({ position: i })
          .eq("id", photoId)
          .eq("property_id", id),
      ),
    );
    return json({ ok: true });
  }
  const parsed = z
    .object({
      photo_id: z.string().uuid(),
      is_cover: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return err("invalid payload");
  if (parsed.data.is_cover) {
    await supabase
      .from("property_photos")
      .update({ is_cover: false })
      .eq("property_id", id);
    await supabase
      .from("property_photos")
      .update({ is_cover: true })
      .eq("id", parsed.data.photo_id)
      .eq("property_id", id);
  }
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  const photoId = req.nextUrl.searchParams.get("photo_id");
  if (!photoId) return err("photo_id required");
  const prop = await supabase
    .from("properties")
    .select("id")
    .eq("id", id)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!prop.data) return err("not found", 404);
  await supabase
    .from("property_photos")
    .delete()
    .eq("id", photoId)
    .eq("property_id", id);
  return json({ ok: true });
}
