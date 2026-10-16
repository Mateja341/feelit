import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Stripe webhook: on checkout.session.completed, inserts the submitted villa
 * into Supabase via the service-role client. Configure STRIPE_WEBHOOK_SECRET
 * and point the Stripe webhook to /api/stripe/webhook.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Webhook is not configured (missing STRIPE_WEBHOOK_SECRET or signature)." },
      { status: 400 },
    );
  }

  let event;
  try {
    const stripe = getStripe();
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json(
      { error: `Webhook verification failed: ${message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const md = session.metadata ?? {};

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase service role is not configured." },
        { status: 500 },
      );
    }

    const { error } =
      md.type === "booking"
        ? await supabase.from("bookings").insert({
            villa_id: md.villa_id ?? "",
            villa_name: md.villa_name ?? "",
            check_in: md.check_in ?? null,
            check_out: md.check_out ?? null,
            guests: Number(md.guests ?? 0),
            nights: Number(md.nights ?? 0),
            deposit_cents: Number(md.deposit_cents ?? 0),
            guest_email: session.customer_details?.email ?? null,
            stripe_session_id: session.id,
            status: "confirmed",
          })
        : await supabase.from("villas").insert({
            name: md.villa_name ?? "Untitled Villa",
            location: md.villa_location ?? "",
            description: md.villa_description ?? "",
            price_per_night: Number(md.villa_price_per_night ?? 0),
            bedrooms: Number(md.villa_bedrooms ?? 0),
            guests: Number(md.villa_guests ?? 0),
            stripe_session_id: session.id,
            owner_email: session.customer_details?.email ?? null,
            status: "published",
          });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
