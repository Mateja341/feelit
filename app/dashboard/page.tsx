import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { priceFmt } from "@/lib/format";

export const metadata = {
  title: "Dashboard — Feelit",
};

type VillaRow = {
  id: string;
  name: string;
  location: string;
  price_per_night: number;
  status: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  villa_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  deposit_cents: number;
  status: string;
};

function Notice({ title, copy, cta }: { title: string; copy: string; cta?: ReactNode }) {
  return (
    <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-10 text-center">
      <h1 className="font-display text-3xl text-slate-100">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-mist">{copy}</p>
      {cta}
    </div>
  );
}

async function DashboardContent() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <Notice
        title="Members' area"
        copy="Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable your dashboard."
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Notice
        title="Members' area"
        copy="Sign in to view your listings and stays."
        cta={
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink-deep"
          >
            Sign in
          </Link>
        }
      />
    );
  }

  const [{ data: myVillas }, { data: myBookings }] = await Promise.all([
    supabase
      .from("villas")
      .select("id, name, location, price_per_night, status, created_at")
      .or(`owner_id.eq.${user.id},owner_email.eq.${user.email}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, villa_name, check_in, check_out, guests, deposit_cents, status")
      .eq("guest_email", user.email)
      .order("created_at", { ascending: false }),
  ]);

  const villas = (myVillas ?? []) as VillaRow[];
  const bookings = (myBookings ?? []) as BookingRow[];

  return (
    <section className="mx-auto max-w-5xl px-6 pb-24 pt-32">
      <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
        {user.email}
      </p>
      <h1 className="mt-3 font-display text-4xl text-slate-100">
        Your <span className="gold-text italic">Feelit</span> home
      </h1>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-slate-100">My listings</h2>
          <Link
            href="/host"
            className="gold-border rounded-full px-4 py-1.5 text-xs text-gold-bright transition-colors hover:bg-gold/10"
          >
            + List a villa
          </Link>
        </div>
        {villas.length === 0 ? (
          <p className="glass mt-4 rounded-2xl p-6 text-sm text-mist">
            No villas yet — your first listing is one $49 checkout away.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {villas.map((v) => (
              <div
                key={v.id}
                className="glass flex items-center justify-between rounded-2xl px-5 py-4"
              >
                <div>
                  <Link
                    href={`/villas/${v.id}`}
                    className="font-display text-lg text-slate-100 hover:text-gold-bright"
                  >
                    {v.name}
                  </Link>
                  <div className="text-xs text-mist">{v.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gold-bright">
                    {priceFmt.format(v.price_per_night)}/night
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-mist">
                    {v.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-slate-100">My stays</h2>
        {bookings.length === 0 ? (
          <p className="glass mt-4 rounded-2xl p-6 text-sm text-mist">
            No reservations yet — the collection awaits.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="glass flex items-center justify-between rounded-2xl px-5 py-4"
              >
                <div>
                  <div className="font-display text-lg text-slate-100">
                    {b.villa_name}
                  </div>
                  <div className="text-xs text-mist">
                    {b.check_in} → {b.check_out} · {b.guests} guests
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gold-bright">
                    {priceFmt.format(b.deposit_cents / 100)} deposit
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-mist">
                    {b.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora left-[-10%] top-[10%] h-[28rem] w-[28rem] bg-gold/25" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-6 pt-32">
            <div className="glass h-64 animate-pulse rounded-3xl bg-white/5" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </main>
  );
}
