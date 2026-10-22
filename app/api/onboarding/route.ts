import { type NextRequest } from "next/server";
import { z } from "zod";
import {
  audit,
  clientIp,
  ensureProfile,
  err,
  getAuth,
  json,
} from "@/lib/api";
import { encryptField, maskField } from "@/lib/crypto";
import { validateJMBG } from "@/lib/validation";

/**
 * GET  → current draft + step for ?role=guest|host
 * PATCH → autosave: { role, step, data } merges data into the draft
 * POST  → submit: { role } validates draft → writes normalized rows
 */

const ROLES = ["guest", "host"] as const;

export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  await ensureProfile(supabase, user);
  const role = req.nextUrl.searchParams.get("role") ?? "guest";
  const draftCol = role === "host" ? "host_draft" : "guest_draft";
  const stepCol = role === "host" ? "host_step" : "guest_step";
  const { data } = await supabase
    .from("profiles")
    .select(
      `email, roles, first_name, last_name, phone, ${draftCol}, ${stepCol}, guest_onboarded, host_onboarded`,
    )
    .eq("id", user.id)
    .single();
  return json({ profile: data, user_id: user.id });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      role: z.enum(ROLES),
      step: z.number().int().min(0).max(20),
      data: z.record(z.string(), z.unknown()),
    })
    .safeParse(body);
  if (!parsed.success) return err("invalid payload");
  const { role, step, data } = parsed.data;
  const draftCol = role === "host" ? "host_draft" : "guest_draft";
  const stepCol = role === "host" ? "host_step" : "guest_step";

  const { data: prof } = await supabase
    .from("profiles")
    .select(draftCol)
    .eq("id", user.id)
    .single();
  const merged = {
    ...(((prof as Record<string, unknown> | null)?.[draftCol] as object) ?? {}),
    ...data,
  };
  const { error } = await supabase
    .from("profiles")
    .update({ [draftCol]: merged, [stepCol]: step })
    .eq("id", user.id);
  if (error) return err(error.message, 500);
  return json({ ok: true, draft: merged });
}

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const body = await req.json().catch(() => null);
  const role = z.enum(ROLES).safeParse(body?.role);
  if (!role.success) return err("invalid role");
  const isHost = role.data === "host";
  const draftCol = isHost ? "host_draft" : "guest_draft";

  const { data: prof } = await supabase
    .from("profiles")
    .select(`${draftCol}, email`)
    .eq("id", user.id)
    .single();
  const d = ((prof as Record<string, unknown> | null)?.[draftCol] ??
    {}) as Record<string, unknown>;
  const ip = clientIp(req);

  if (!isHost) {
    // ---- GUEST submit ----
    const personal = (d.personal ?? {}) as Record<string, string>;
    if (!personal.first_name || !personal.last_name)
      return err("personal step incomplete");
    const identity = (d.identity ?? {}) as Record<string, string>;
    if (!identity.doc_type || !identity.doc_number)
      return err("identity step incomplete");
    if (
      identity.doc_type === "jmbg" &&
      !validateJMBG(identity.doc_number)
    )
      return err("invalid JMBG");
    const residential = (d.residential ?? {}) as Record<string, string>;
    if (!residential.line1 || !residential.city || !residential.country)
      return err("address step incomplete");
    const consents = (d.consents ?? {}) as Record<string, boolean>;
    if (!consents.terms || !consents.privacy || !consents.house_rules || !consents.deposit)
      return err("required consents missing");

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        first_name: personal.first_name,
        last_name: personal.last_name,
        parent_name: personal.parent_name || null,
        date_of_birth: personal.date_of_birth,
        gender: personal.gender || null,
        nationality: personal.nationality || null,
        country_of_residence: personal.country_of_residence || null,
        preferred_language: personal.preferred_language || "en",
        preferred_currency: personal.preferred_currency || "USD",
        occupation: personal.occupation || null,
        phone: personal.phone || null,
        phone_verified: Boolean(personal.phone_verified),
        travel_purpose: (d.travel as Record<string, string> | undefined)?.travel_purpose || null,
        arrival_method: (d.travel as Record<string, string> | undefined)?.arrival_method || null,
        special_requests: (d.travel as Record<string, string> | undefined)?.special_requests || null,
        allergies_diet: (d.travel as Record<string, string> | undefined)?.allergies_diet || null,
        pets: (d.travel as Record<string, boolean> | undefined)?.pets ?? null,
        guest_onboarded: true,
        guest_step: 0,
        guest_draft: {},
      })
      .eq("id", user.id);
    if (pErr) return err(pErr.message, 500);

    await supabase.from("identity_documents").upsert(
      {
        user_id: user.id,
        doc_type: identity.doc_type,
        number_enc: encryptField(identity.doc_number),
        number_masked: maskField(identity.doc_number),
        issue_date: identity.issue_date || null,
        expiry_date: identity.expiry_date || null,
        issuing_country: identity.issuing_country,
        front_path: identity.front_path || null,
        back_path: identity.back_path || null,
        selfie_path: identity.selfie_path || null,
        status: "PENDING",
      },
      { onConflict: "user_id,doc_type" },
    );

    await supabase.from("addresses").delete().eq("user_id", user.id);
    await supabase.from("addresses").insert([
      { user_id: user.id, kind: "residential", ...residential },
      ...((d.billing_same === false && d.billing)
        ? [
            {
              user_id: user.id,
              kind: "billing",
              ...(d.billing as Record<string, string>),
            },
          ]
        : [
            {
              user_id: user.id,
              kind: "billing",
              ...residential,
            },
          ]),
    ]);

    const emergency = (d.emergency ?? {}) as Record<string, string>;
    if (emergency.name) {
      await supabase.from("emergency_contacts").delete().eq("user_id", user.id);
      await supabase
        .from("emergency_contacts")
        .insert({ user_id: user.id, ...emergency });
    }

    const extra = (d.additional_guests ?? []) as Record<string, string>[];
    await supabase.from("additional_guests").delete().eq("user_id", user.id);
    if (extra.length) {
      await supabase.from("additional_guests").insert(
        extra.map((g) => ({
          user_id: user.id,
          full_name: g.full_name,
          date_of_birth: g.date_of_birth || null,
          id_number_enc: g.id_number ? encryptField(g.id_number) : null,
          id_number_masked: g.id_number ? maskField(g.id_number) : null,
          relationship: g.relationship || null,
        })),
      );
    }

    for (const [kind, accepted] of Object.entries({
      terms: !!consents.terms,
      privacy: !!consents.privacy,
      house_rules: !!consents.house_rules,
      deposit: !!consents.deposit,
      marketing: !!consents.marketing,
    })) {
      await supabase
        .from("consents")
        .insert({ user_id: user.id, kind, accepted, ip });
    }
    await audit(supabase, user.id, "guest_onboarding_submit", {}, ip);
    return json({ ok: true });
  }

  // ---- HOST submit ----
  const host = (d.host ?? {}) as Record<string, string>;
  if (!host.host_type) return err("host type step incomplete");
  if (host.host_type === "individual" && (!host.id_number || !host.date_of_birth))
    return err("individual identity incomplete");
  if (
    host.host_type === "individual" &&
    host.id_type === "jmbg" &&
    !validateJMBG(host.id_number)
  )
    return err("invalid JMBG");
  if (
    host.host_type === "company" &&
    (!host.legal_name || !host.registration_number || !host.tax_id)
  )
    return err("company data incomplete");
  const payout = (d.payout ?? {}) as Record<string, string>;
  if (payout.kind === "bank" && (!payout.iban || !payout.account_holder))
    return err("payout setup incomplete");
  const publicP = (d.public ?? {}) as Record<string, string>;
  if (!publicP.display_name) return err("public profile incomplete");
  const consents = (d.consents ?? {}) as Record<string, boolean>;
  if (!consents.host_terms || !consents.privacy || !consents.cancellation || !consents.regulation)
    return err("required consents missing");

  const { error: hpErr } = await supabase.from("host_profiles").upsert(
    {
      user_id: user.id,
      host_type: host.host_type,
      id_number_enc: host.id_number ? encryptField(host.id_number) : null,
      date_of_birth: host.date_of_birth || null,
      address: host.address || null,
      legal_name: host.legal_name || null,
      registration_number: host.registration_number || null,
      tax_id_enc: host.tax_id ? encryptField(host.tax_id) : null,
      vat_number: host.vat_number || null,
      legal_address: host.legal_address || null,
      rep_full_name: host.rep_full_name || null,
      rep_id_number_enc: host.rep_id_number
        ? encryptField(host.rep_id_number)
        : null,
      display_name: publicP.display_name,
      photo_url: publicP.photo_url || null,
      bio: publicP.bio || null,
      languages: (publicP.languages ?? "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      response_time: publicP.response_time || null,
      years_hosting: publicP.years_hosting
        ? parseInt(publicP.years_hosting, 10)
        : null,
      verification_status: "VERIFIED",
      tax_residency: payout.tax_residency || null,
    },
    { onConflict: "user_id" },
  );
  if (hpErr) return err(hpErr.message, 500);

  const identity = (d.identity ?? {}) as Record<string, string>;
  if (identity.doc_number) {
    await supabase.from("identity_documents").upsert(
      {
        user_id: user.id,
        doc_type: identity.doc_type || "national_id",
        number_enc: encryptField(identity.doc_number),
        number_masked: maskField(identity.doc_number),
        issue_date: identity.issue_date || null,
        expiry_date: identity.expiry_date || null,
        issuing_country: identity.issuing_country || host.country || "RS",
        front_path: identity.front_path || null,
        back_path: identity.back_path || null,
        selfie_path: identity.selfie_path || null,
        status: "PENDING",
      },
      { onConflict: "user_id,doc_type" },
    );
  }
  const ownership = (d.ownership ?? {}) as Record<string, string>;
  if (ownership.path) {
    await supabase.from("identity_documents").upsert(
      {
        user_id: user.id,
        doc_type: "national_id",
        number_enc: encryptField(ownership.note || "ownership-proof"),
        number_masked: maskField(ownership.note || "ownership-proof"),
        front_path: ownership.path,
        issuing_country: "RS",
        status: "PENDING",
      },
      { onConflict: "user_id,doc_type" },
    );
  }

  if (payout.kind === "bank") {
    await supabase.from("payout_accounts").upsert(
      {
        user_id: user.id,
        kind: "bank",
        account_holder: payout.account_holder,
        iban_enc: encryptField(payout.iban),
        iban_masked: maskField(payout.iban),
        swift: payout.swift || null,
        bank_name: payout.bank_name || null,
        currency: payout.currency || "USD",
        status: "active",
      },
      { onConflict: "user_id" },
    );
  }

  for (const [kind, accepted] of Object.entries({
    host_terms: !!consents.host_terms,
    privacy: !!consents.privacy,
    cancellation: !!consents.cancellation,
    regulation: !!consents.regulation,
    marketing: !!consents.marketing,
  })) {
    await supabase
      .from("consents")
      .insert({ user_id: user.id, kind, accepted, ip });
  }

  const { data: prof2 } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();
  const roles = Array.from(new Set([...(prof2?.roles ?? []), "HOST"]));
  await supabase
    .from("profiles")
    .update({ roles, host_onboarded: true, host_step: 0, host_draft: {} })
    .eq("id", user.id);
  await audit(supabase, user.id, "host_onboarding_submit", {}, ip);
  return json({ ok: true });
}
