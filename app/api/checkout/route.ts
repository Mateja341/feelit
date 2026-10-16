import { NextResponse } from "next/server";
import { getStripe, getSiteUrl, LISTING_FEE_CENTS } from "@/lib/stripe";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const location = String(body.location ?? "").trim();
  const pricePerNight = Number(body.price_per_night);
  if (!name || !location || !Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    return NextResponse.json(
      { error: "Villa name, location and a positive nightly rate are required." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: LISTING_FEE_CENTS,
            product_data: {
              name: "Feelit Villa Listing",
              description: `One-time listing fee — ${name}, ${location}`,
            },
          },
        },
      ],
      metadata: {
        villa_name: name,
        villa_location: location,
        villa_description: String(body.description ?? ""),
        villa_price_per_night: String(pricePerNight),
        villa_bedrooms: String(body.bedrooms ?? ""),
        villa_guests: String(body.guests ?? ""),
      },
      success_url: `${siteUrl}/host/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/host?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
