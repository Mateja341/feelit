import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json } from "@/lib/api";

/** GET/POST/DELETE own gallery photos (upload handled client→storage, this stores the row). */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { data } = await supabase
    .from("user_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return json({ photos: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({
      url: z.string().min(1),
      caption: z.string().optional(),
      property_id: z.string().uuid().optional(),
      booking_id: z.string().uuid().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const { data, error } = await supabase
    .from("user_photos")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ photo: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return err("id required");
  await supabase.from("user_photos").delete().eq("id", id).eq("user_id", user.id);
  return json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({ id: z.string().uuid(), caption: z.string() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  await supabase
    .from("user_photos")
    .update({ caption: parsed.data.caption })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  return json({ ok: true });
}
