import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getVillaById } from "@/lib/villas";
import { BOOKING_DEPOSIT_RATE } from "@/lib/types";

const MS_PER_DAY = 86400000;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const villaId = String(body.villa_id ?? "").trim();
  const checkIn = String(body.check_in ?? "");
  const checkOut = String(body.check_out ?? "");
  const guests = Number(body.guests);

  const villa = villaId ? await getVillaById(villaId) : null;
  if (!villa) {
    return NextResponse.json({ error: "Villa not found." }, { status: 404 });
  }

  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();
  const nights = Math.floor((outMs - inMs) / MS_PER_DAY);

  if (!Number.isFinite(nights) || nights < 1) {
    return NextResponse.json(
      { error: "Check-out must be after check-in." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(guests) || guests < 1 || guests > villa.guests) {
    return NextResponse.json(
      { error: `Guests must be between 1 and ${villa.guests}.` },
      { status: 400 },
    );
  }

  const depositCents = Math.round(
    nights * villa.price_per_night * BOOKING_DEPOSIT_RATE * 100,
  );

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
            unit_amount: depositCents,
            product_data: {
              name: `${villa.name} — ${nights} ${nights === 1 ? "night" : "nights"}`,
              description: `${checkIn} → ${checkOut} · ${guests} guests · ${Math.round(
                BOOKING_DEPOSIT_RATE * 100,
              )}% deposit`,
            },
          },
        },
      ],
      metadata: {
        type: "booking",
        villa_id: villa.id,
        villa_name: villa.name,
        check_in: checkIn,
        check_out: checkOut,
        guests: String(guests),
        nights: String(nights),
        deposit_cents: String(depositCents),
      },
      success_url: `${siteUrl}/villas/${villa.id}/booked?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/villas/${villa.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
