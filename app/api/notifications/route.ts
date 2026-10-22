import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json } from "@/lib/api";

export async function GET() {
  const auth = await getAuth();
  if (!auth) return json({ notifications: [] });
  const { supabase, user } = auth;
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return json({ notifications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({ id: z.string().uuid().optional(), all: z.boolean().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  let q = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (parsed.data.id) q = q.eq("id", parsed.data.id);
  await q;
  return json({ ok: true });
}
