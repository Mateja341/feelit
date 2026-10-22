import { err, getAuth, json } from "@/lib/api";

/** GET → host dashboard overview numbers. */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const { data: props } = await supabase
    .from("properties")
    .select("id,status")
    .eq("host_id", user.id);
  const ids = (props ?? []).map((p) => p.id);
  const monthStart = new Date();
  monthStart.setDate(1);

  const stats = {
    properties_total: ids.length,
    properties_published: (props ?? []).filter((p) => p.status === "PUBLISHED").length,
    earnings_month: 0,
    upcoming_checkins: 0,
    pending_requests: 0,
    occupancy_pct: 0,
    recent_payouts: [] as unknown[],
  };
  if (!ids.length) return json(stats);

  const { data: month } = await supabase
    .from("bookings")
    .select("total")
    .in("property_id", ids)
    .in("status", ["CONFIRMED", "COMPLETED"])
    .gte("created_at", monthStart.toISOString());
  stats.earnings_month = (month ?? []).reduce((s, b) => s + Number(b.total), 0);

  const today = new Date().toISOString().slice(0, 10);
  const { count: checkins } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("property_id", ids)
    .eq("status", "CONFIRMED")
    .gte("check_in", today);
  stats.upcoming_checkins = checkins ?? 0;

  const { count: pending } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("property_id", ids)
    .eq("status", "PENDING");
  stats.pending_requests = pending ?? 0;

  const in90 = new Date(Date.now() + 90 * 86400e3).toISOString().slice(0, 10);
  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("start_date,end_date")
    .in("property_id", ids)
    .lt("start_date", in90)
    .gt("end_date", today);
  const nights = (blocks ?? []).reduce(
    (s, b) =>
      s +
      (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) /
        86400e3,
    0,
  );
  stats.occupancy_pct = ids.length
    ? Math.min(100, Math.round((nights / (90 * ids.length)) * 100))
    : 0;

  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  stats.recent_payouts = payouts ?? [];
  return json(stats);
}
