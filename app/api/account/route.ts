import { type NextRequest } from "next/server";
import { err, getAuth, json, audit, clientIp } from "@/lib/api";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { decryptField } from "@/lib/crypto";

/** GET → GDPR data export (JSON). DELETE → delete account unless active bookings. */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const tables = [
    "profiles",
    "host_profiles",
    "identity_documents",
    "addresses",
    "emergency_contacts",
    "additional_guests",
    "payment_methods",
    "payout_accounts",
    "consents",
    "favorites",
    "bookings",
    "user_photos",
    "reviews",
    "notifications",
  ] as const;
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), email: user.email };
  for (const t of tables) {
    const col = t === "profiles" || t === "host_profiles" ? (t === "profiles" ? "id" : "user_id") : "user_id";
    const { data } = await supabase.from(t).select("*").eq(col as never, user.id);
    out[t] = data ?? [];
  }
  const { data: props } = await supabase
    .from("properties")
    .select("*")
    .eq("host_id", user.id);
  out["properties"] = props ?? [];
  await audit(supabase, user.id, "gdpr_export");
  return json(out);
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  // re-auth before destructive action
  if (body?.password) {
    const { error: pwErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: body.password,
    });
    if (pwErr) return err("password check failed", 403);
  } else {
    return err("password required", 403);
  }

  // block while active bookings exist (as guest or host)
  const { count: guestActive } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", user.id)
    .in("status", ["PENDING", "CONFIRMED"])
    .gte("check_out", new Date().toISOString().slice(0, 10));
  const { data: myProps } = await supabase
    .from("properties")
    .select("id")
    .eq("host_id", user.id);
  const propIds = (myProps ?? []).map((p) => p.id);
  let hostActive = 0;
  if (propIds.length) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("property_id", propIds)
      .in("status", ["PENDING", "CONFIRMED"])
      .gte("check_out", new Date().toISOString().slice(0, 10));
    hostActive = count ?? 0;
  }
  if ((guestActive ?? 0) > 0 || hostActive > 0)
    return err(
      "you still have active bookings — cancel or complete them first",
      422,
    );

  await audit(supabase, user.id, "account_deleted", {}, clientIp(req));
  const svc = createServiceRoleClient();
  if (svc) {
    await svc.auth.admin.deleteUser(user.id);
  } else {
    await supabase.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", user.id);
  }
  return json({ ok: true });
}
