import { NextRequest } from "next/server";
import { getAuth, json, err, rateLimit, clientIp, audit } from "@/lib/api";
import { decryptField } from "@/lib/crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/identity/reveal — password re-auth, then decrypt and return the
 * full document number. Audited.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  if (!rateLimit(`reveal:${auth.user.id}`, 5, 60_000))
    return err("too many attempts", 429);
  const { id, password } = await req.json();
  if (!id || !password) return err("id and password required", 400);

  // Re-authenticate with the supplied password.
  const supabase = await createSupabaseServerClient();
  if (!supabase) return err("not configured", 503);
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: auth.user.email!,
    password,
  });
  if (authErr) return err("wrong password", 403);

  const { data: doc } = await auth.supabase
    .from("identity_documents")
    .select("number_enc")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!doc?.number_enc) return err("not found", 404);

  await audit(
    auth.supabase,
    auth.user.id,
    "identity.reveal",
    { entity: "identity_documents", entity_id: id },
    clientIp(req),
  );
  return json({ number: decryptField(doc.number_enc) });
}
