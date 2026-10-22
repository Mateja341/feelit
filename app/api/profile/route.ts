import { type NextRequest } from "next/server";
import { err, getAuth, getProfile, json } from "@/lib/api";
import { z } from "zod";

/** GET → full profile bundle for /profile */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const [
    profile,
    hostProfile,
    docs,
    addresses,
    emergency,
    guests,
    payments,
    photos,
    favs,
    notifs,
  ] = await Promise.all([
    getProfile(supabase, user.id),
    supabase.from("host_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("identity_documents")
      .select("id,doc_type,number_masked,issue_date,expiry_date,issuing_country,status,reject_reason,front_path,back_path,selfie_path")
      .eq("user_id", user.id),
    supabase.from("addresses").select("*").eq("user_id", user.id),
    supabase.from("emergency_contacts").select("*").eq("user_id", user.id),
    supabase
      .from("additional_guests")
      .select("id,full_name,date_of_birth,id_number_masked,relationship")
      .eq("user_id", user.id),
    supabase
      .from("payment_methods")
      .select("id,brand,last4,exp_month,exp_year,cardholder_name,billing_zip,is_default,stripe_pm_id")
      .eq("user_id", user.id),
    supabase
      .from("user_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("favorites")
      .select("property_id, properties(id,title,city,country,nightly_price,rating,accent, property_photos(url,is_cover))")
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  return json({
    profile,
    host_profile: hostProfile.data ?? null,
    documents: docs.data ?? [],
    addresses: addresses.data ?? [],
    emergency_contacts: emergency.data ?? [],
    additional_guests: guests.data ?? [],
    payment_methods: payments.data ?? [],
    photos: photos.data ?? [],
    favorites: favs.data ?? [],
    notifications: notifs.data ?? [],
  });
}

const patchSchema = z.object({
  first_name: z.string().trim().min(1).optional(),
  last_name: z.string().trim().min(1).optional(),
  parent_name: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  country_of_residence: z.string().optional().nullable(),
  preferred_language: z.string().optional(),
  preferred_currency: z.string().optional(),
  occupation: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  travel_purpose: z.string().optional().nullable(),
  arrival_method: z.string().optional().nullable(),
  special_requests: z.string().optional().nullable(),
  allergies_diet: z.string().optional().nullable(),
  pets: z.boolean().optional().nullable(),
  notify_email: z.boolean().optional(),
  notify_inapp: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err("invalid payload");
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);
  if (error) return err(error.message, 500);
  return json({ ok: true });
}
