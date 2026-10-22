import { err, getAuth, json, rateLimit } from "@/lib/api";
import { getStripe } from "@/lib/stripe";

/** POST → create/lookup Stripe customer + SetupIntent for card collection. */
export async function POST() {
  if (!rateLimit("pm:setup", 15, 60_000)) return err("rate limited", 429);
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const stripe = getStripe();

  const { data: existing } = await supabase
    .from("payment_methods")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { feelit_user: user.id },
    });
    customerId = customer.id;
  }

  const si = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
  });
  return json({
    client_secret: si.client_secret,
    setup_intent_id: si.id,
    publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}
