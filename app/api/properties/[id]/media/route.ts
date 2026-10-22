import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const KINDS = ["MODEL_3D", "DRONE_VIDEO", "WALK_VIDEO"] as const;

async function owns(supabase: any, userId: string, id: string) {
  const { data } = await supabase
    .from("properties")
    .select("id")
    .eq("id", id)
    .eq("host_id", userId)
    .maybeSingle();
  return !!data;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  const client =
    auth?.supabase ??
    (await import("@/lib/supabase/server")).createServerSupabaseClient();
  if (!client) return err("db unavailable", 500);
  const { id } = await ctx.params;
  const { data } = await client
    .from("property_media")
    .select("*")
    .eq("property_id", id);
  return json({ media: data ?? [] });
}

/** POST {kind, url?} → attach/replace media; {kind, generate:true} → stub pipeline → PROCESSING */
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  if (!(await owns(supabase, user.id, id))) return err("not found", 404);
  const parsed = z
    .object({
      kind: z.enum(KINDS),
      url: z.string().optional(),
      generate: z.boolean().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const { kind, url, generate } = parsed.data;
  const status = url ? "READY" : generate ? "PROCESSING" : "NOT_GENERATED";
  const { data, error } = await supabase
    .from("property_media")
    .upsert(
      { property_id: id, kind, url: url ?? null, status },
      { onConflict: "property_id,kind" },
    )
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ media: data });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  const kind = req.nextUrl.searchParams.get("kind") as (typeof KINDS)[number];
  if (!KINDS.includes(kind)) return err("kind required");
  if (!(await owns(supabase, user.id, id))) return err("not found", 404);
  await supabase
    .from("property_media")
    .update({ url: null, status: "NOT_GENERATED" })
    .eq("property_id", id)
    .eq("kind", kind);
  return json({ ok: true });
}
