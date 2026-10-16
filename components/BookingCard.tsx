"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Villa } from "@/lib/types";
import { BOOKING_DEPOSIT_RATE } from "@/lib/types";
import { priceFmt } from "@/lib/format";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function BookingCard({ villa }: { villa: Villa }) {
  const today = useMemo(() => new Date(), []);
  const defaultIn = toISO(new Date(today.getTime() + 30 * 86400000));
  const defaultOut = toISO(new Date(today.getTime() + 35 * 86400000));

  const [checkIn, setCheckIn] = useState(defaultIn);
  const [checkOut, setCheckOut] = useState(defaultOut);
  const [guests, setGuests] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = useMemo(() => {
    const diff =
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000;
    return Number.isFinite(diff) && diff > 0 ? Math.floor(diff) : 0;
  }, [checkIn, checkOut]);

  const total = nights * villa.price_per_night;
  const deposit = Math.round(total * BOOKING_DEPOSIT_RATE);

  async function reserve() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villa_id: villa.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const valid = nights > 0 && guests >= 1 && guests <= villa.guests;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="glass-strong sticky top-28 flex flex-col gap-5 rounded-3xl p-6"
    >
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-gold-bright">
            {priceFmt.format(villa.price_per_night)}
          </div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-mist">
            per night
          </div>
        </div>
        <div className="text-sm font-semibold text-gold-bright">
          ★ {villa.rating.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.25em] text-mist">
            Check-in
          </span>
          <input
            type="date"
            value={checkIn}
            min={toISO(today)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="glass rounded-xl px-3 py-2.5 text-sm text-slate-100 [color-scheme:dark]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.25em] text-mist">
            Check-out
          </span>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="glass rounded-xl px-3 py-2.5 text-sm text-slate-100 [color-scheme:dark]"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.25em] text-mist">
          Guests · up to {villa.guests}
        </span>
        <input
          type="number"
          min={1}
          max={villa.guests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="glass rounded-xl px-3 py-2.5 text-sm text-slate-100"
        />
      </label>

      <div className="hairline" />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>
            {priceFmt.format(villa.price_per_night)} × {nights}{" "}
            {nights === 1 ? "night" : "nights"}
          </span>
          <span>{nights > 0 ? priceFmt.format(total) : "—"}</span>
        </div>
        <div className="flex justify-between font-semibold text-gold-bright">
          <span>Due now · {Math.round(BOOKING_DEPOSIT_RATE * 100)}% deposit</span>
          <span>{nights > 0 ? priceFmt.format(deposit) : "—"}</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: valid ? 1.02 : 1 }}
        whileTap={{ scale: valid ? 0.98 : 1 }}
        onClick={reserve}
        disabled={!valid || submitting}
        className="mt-1 rounded-full bg-gold py-3 text-sm font-bold text-ink-deep transition-opacity disabled:opacity-40"
      >
        {submitting
          ? "Opening secure checkout…"
          : `Reserve · pay ${priceFmt.format(deposit)} deposit`}
      </motion.button>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <p className="text-center text-[10px] leading-relaxed text-mist">
        Deposit held by Stripe · balance due 30 days before arrival · free
        cancellation for 72h
      </p>
    </motion.aside>
  );
}
