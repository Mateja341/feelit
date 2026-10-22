import { type NextRequest } from "next/server";
import { z } from "zod";
import { audit, err, getAuth, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH → {action: cancel|accept|decline|complete|modify, ...} */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { id } = await ctx.params;
  const parsed = z
    .object({
      action: z.enum(["cancel", "accept", "decline", "complete", "modify"]),
      reason: z.string().optional(),
      check_in: z.string().optional(),
      check_out: z.string().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");
  const { action, reason } = parsed.data;

  const { data: bk } = await supabase
    .from("bookings")
    .select("*, properties(host_id,title)")
    .eq("id", id)
    .maybeSingle();
  if (!bk) return err("not found", 404);
  const isGuest = bk.guest_id === user.id;
  const isHost = bk.properties?.host_id === user.id;
  if (!isGuest && !isHost) return err("not found", 404);

  if (action === "cancel") {
    const { data: refund, error } = await supabase.rpc("cancel_booking", {
      p_booking: id,
      p_by: user.id,
    });
    if (error) return err(error.message, 422);
    await audit(supabase, user.id, "booking_cancelled", { id });
    return json({ ok: true, refund });
  }
  if (action === "accept") {
    if (!isHost) return err("only host can accept", 403);
    await supabase
      .from("bookings")
      .update({ status: "CONFIRMED" })
      .eq("id", id)
      .eq("status", "PENDING");
    await supabase.from("notifications").insert({
      user_id: bk.guest_id,
      kind: "booking",
      title: "Booking confirmed",
      body: bk.properties?.title ?? "",
      link: "/profile?tab=bookings",
    });
    return json({ ok: true });
  }
  if (action === "decline") {
    if (!isHost) return err("only host can decline", 403);
    await supabase
      .from("bookings")
      .update({ status: "DECLINED", decline_reason: reason ?? null })
      .eq("id", id)
      .eq("status", "PENDING");
    await supabase
      .from("availability_blocks")
      .delete()
      .eq("booking_id", id);
    return json({ ok: true });
  }
  if (action === "complete") {
    if (!isHost) return err("only host can complete", 403);
    await supabase
      .from("bookings")
      .update({ status: "COMPLETED" })
      .eq("id", id);
    return json({ ok: true });
  }
  // modify: re-book the transaction with new dates (guest only, PENDING/CONFIRMED)
  if (action === "modify") {
    if (!isGuest) return err("only guest can modify", 403);
    if (!parsed.data.check_in || !parsed.data.check_out)
      return err("new dates required");
    const { error: cErr } = await supabase.rpc("cancel_booking", {
      p_booking: id,
      p_by: user.id,
    });
    if (cErr) return err(cErr.message, 422);
    const { data: newId, error } = await supabase.rpc("book_property", {
      p_property_id: bk.property_id,
      p_guest_id: user.id,
      p_check_in: parsed.data.check_in,
      p_check_out: parsed.data.check_out,
      p_guests: bk.guests_count,
      p_rooms: bk.rooms_count,
      p_payment_method: bk.payment_method_id,
    });
    if (error) return err(error.message, 422);
    return json({ ok: true, booking_id: newId });
  }
  return err("unknown action");
}
