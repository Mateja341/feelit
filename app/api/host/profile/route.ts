import { NextRequest } from "next/server";
import { getAuth, json, err, audit, clientIp } from "@/lib/api";

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const body = await req.json();
  const allow = [
    "display_name",
    "bio",
    "languages",
    "response_time",
    "photo_url",
    "years_hosting",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allow) if (k in body) patch[k] = body[k];
  const { error } = await auth.supabase
    .from("host_profiles")
    .update(patch)
    .eq("user_id", auth.user.id);
  if (error) return err(error.message, 500);
  await audit(
    auth.supabase,
    auth.user.id,
    "host_profile.update",
    { entity: "host_profiles" },
    clientIp(req),
  );
  return json({ ok: true });
}
