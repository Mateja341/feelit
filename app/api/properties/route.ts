import { type NextRequest } from "next/server";
import { err, getAuth, getProfile, json } from "@/lib/api";
import { propertySchema } from "@/lib/validation";

/** GET ?mine=1 → host's properties (with photos+media). POST → create draft. */
export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  if (req.nextUrl.searchParams.get("mine")) {
    const { data, error } = await supabase
      .from("properties")
      .select(
        "*, property_photos(id,url,position,is_cover), property_media(id,kind,url,status)",
      )
      .eq("host_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return err(error.message, 500);
    return json({ properties: data ?? [] });
  }
  return err("use /api/villas for public listing");
}

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const profile = await getProfile(supabase, user.id);
  if (!profile?.roles?.includes("HOST"))
    return err("complete host onboarding first", 403);

  const body = await req.json().catch(() => ({}));
  const parsed = propertySchema.partial().safeParse(body);
  if (!parsed.success) return err("invalid payload");

  const accents = ["#a855f7", "#c084fc", "#8b5cf6", "#6e3aff", "#7c3aed"];
  const accent = accents[Math.floor(Math.random() * accents.length)];
  const { data, error } = await supabase
    .from("properties")
    .insert({
      host_id: user.id,
      title: parsed.data.title || "Untitled villa",
      ...parsed.data,
      accent,
      status: "DRAFT",
    })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ property: data });
}
