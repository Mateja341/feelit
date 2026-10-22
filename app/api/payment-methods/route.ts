import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json, rateLimit } from "@/lib/api";
import { getStripe } from "@/lib/stripe";

/** GET → list own cards. POST → save a PM after Stripe SetupIntent confirm. */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { data } = await supabase
    .from("payment_methods")
    .select("id,brand,last4,exp_month,exp_year,cardholder_name,billing_zip,is_default,stripe_pm_id")
    .eq("user_id", user.id)
    .order("created_at");
  return json({ payment_methods: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!rateLimit("pm:add", 10, 60_000)) return err("rate limited", 429);
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({
      setup_intent_id: z.string(),
      cardholder_name: z.string().optional(),
      billing_zip: z.string().optional(),
      is_default: z.boolean().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const { setup_intent_id, cardholder_name, billing_zip, is_default } =
    parsed.data;

  const stripe = getStripe();
  const si = await stripe.setupIntents.retrieve(setup_intent_id);
  if (si.status !== "succeeded" || !si.payment_method)
    return err("setup intent not confirmed");
  const pm = await stripe.paymentMethods.retrieve(
    si.payment_method as string,
  );
  const customer = si.customer as string | null;
  if (!customer) return err("missing customer");

  const count = await supabase
    .from("payment_methods")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const makeDefault = is_default || (count.count ?? 0) === 0;
  if (makeDefault) {
    await supabase
      .from("payment_methods")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }
  const { data, error } = await supabase
    .from("payment_methods")
    .upsert(
      {
        user_id: user.id,
        stripe_customer_id: customer,
        stripe_pm_id: pm.id,
        cardholder_name: cardholder_name || pm.billing_details?.name || null,
        brand: pm.card?.brand ?? null,
        last4: pm.card?.last4 ?? null,
        exp_month: pm.card?.exp_month ?? null,
        exp_year: pm.card?.exp_year ?? null,
        billing_zip: billing_zip || pm.card?.funding || null,
        is_default: makeDefault,
      },
      { onConflict: "stripe_pm_id" },
    )
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ payment_method: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return err("id required");
  await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  return json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({ id: z.string().uuid(), is_default: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  if (parsed.data.is_default) {
    await supabase
      .from("payment_methods")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }
  await supabase
    .from("payment_methods")
    .update({ is_default: parsed.data.is_default })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  return json({ ok: true });
}
