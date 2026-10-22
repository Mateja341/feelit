import { type NextRequest } from "next/server";
import { audit, clientIp, err, getAuth, json, rateLimit } from "@/lib/api";
import { bookingSchema } from "@/lib/validation";
import { getStripe } from "@/lib/stripe";

/** GET → guest's own bookings (or ?host=1 for reservations on own properties). */
export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const sel =
    "*, properties(id,title,city,country,accent,instant_book,cancellation_policy, property_photos(url,is_cover)), profiles!bookings_guest_id_fkey(first_name,last_name,email,phone)";
  let q = supabase.from("bookings").select(sel).order("check_in");
  q = req.nextUrl.searchParams.get("host")
    ? q.in(
        "property_id",
        (
          await supabase
            .from("properties")
            .select("id")
            .eq("host_id", user.id)
        ).data?.map((p: { id: string }) => p.id) ?? ["none"],
      )
    : q.eq("guest_id", user.id);
  const { data, error } = await q;
  if (error) return err(error.message, 500);
  return json({ bookings: data ?? [] });
}

/** POST → create booking (transactional availability check in book_property). */
export async function POST(req: NextRequest) {
  if (!rateLimit("booking:create", 10, 60_000))
    return err("rate limited", 429);
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = bookingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const b = parsed.data;

  // validate default payment method ownership when provided
  let pmId: string | null = null;
  if (b.payment_method_id) {
    const { data: pm } = await supabase
      .from("payment_methods")
      .select("id, stripe_pm_id, stripe_customer_id")
      .eq("id", b.payment_method_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!pm) return err("payment method not found");
    pmId = pm.id;
  }

  const { data, error } = await supabase.rpc("book_property", {
    p_property_id: b.property_id,
    p_guest_id: user.id,
    p_check_in: b.check_in,
    p_check_out: b.check_out,
    p_guests: b.guests,
    p_rooms: b.rooms,
    p_payment_method: pmId,
  });
  if (error) return err(error.message, 422);

  // charge the deposit off-session when we have a saved card
  let charged = false;
  if (pmId) {
    const { data: pm } = await supabase
      .from("payment_methods")
      .select("stripe_pm_id, stripe_customer_id")
      .eq("id", pmId)
      .single();
    const { data: bk } = await supabase
      .from("bookings")
      .select("deposit,total,status")
      .eq("id", data)
      .single();
    if (pm && bk && Number(bk.deposit) > 0) {
      try {
        const stripe = getStripe();
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(Number(bk.deposit) * 100),
          currency: "usd",
          customer: pm.stripe_customer_id,
          payment_method: pm.stripe_pm_id,
          off_session: true,
          confirm: true,
          metadata: { booking_id: data },
        });
        await supabase
          .from("bookings")
          .update({ stripe_payment_intent: pi.id })
          .eq("id", data);
        charged = true;
      } catch (e) {
        await audit(supabase, user.id, "deposit_charge_failed", {
          booking: data,
          error: String(e),
        });
      }
    }
  }
  await audit(supabase, user.id, "booking_created", { id: data }, clientIp(req));
  return json({ booking_id: data, charged });
}
