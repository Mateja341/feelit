"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Select, useToast } from "./ui";
import { priceFmt } from "@/lib/format";

type Range = { start: string; end: string };

/** Real booking calendar + price summary + transactional book. */
export default function BookingPanel({ property }: { property: any }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [rules, setRules] = useState<Record<string, number>>({});
  const [range, setRange] = useState<Range | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch(`/api/availability/${property.id}`);
    const d = await res.json();
    const un = new Set<string>();
    for (const b of d.blocks ?? []) {
      const s = new Date(b.start_date);
      const e = new Date(b.end_date);
      for (let x = new Date(s); x <= e; x.setDate(x.getDate() + 1))
        un.add(x.toISOString().slice(0, 10));
    }
    for (const b of d.bookings ?? []) {
      const s = new Date(b.check_in);
      const e = new Date(b.check_out);
      for (let x = new Date(s); x < e; x.setDate(x.getDate() + 1))
        un.add(x.toISOString().slice(0, 10));
    }
    setUnavailable(un);
    setRules(
      Object.fromEntries((d.price_rules ?? []).map((r: any) => [r.date, Number(r.price)])),
    );
  }, [property.id]);
  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const y = month.getFullYear();
  const m = month.getMonth();
  const pad = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const iso = (d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const nights: string[] = [];
  if (range?.start && range.end) {
    for (let x = new Date(range.start); x < new Date(range.end); x.setDate(x.getDate() + 1))
      nights.push(x.toISOString().slice(0, 10));
  }
  const nightly = property.nightly_price ?? 0;
  const subtotal = nights.reduce((s, d) => s + (rules[d] ?? nightly), 0);
  const cleaning = property.cleaning_fee ?? 0;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + cleaning + taxes;

  const blockedInside = nights.some((d) => unavailable.has(d));

  const pick = (d: number) => {
    const date = iso(d);
    if (date < today || unavailable.has(date)) return;
    if (!range?.start || (range.start && range.end)) {
      setRange({ start: date, end: "" });
    } else if (date > range.start) {
      setRange({ ...range, end: date });
    } else {
      setRange({ start: date, end: "" });
    }
  };

  const book = async () => {
    if (!range?.start || !range.end) return;
    setBusy(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: property.id,
        check_in: range.start,
        check_out: range.end,
        guests_count: guests,
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (res.status === 401) return router.push(`/auth?next=/villas/${property.id}`);
    if (!res.ok) {
      toast("err", d.error ?? "Booking failed");
      load();
      return;
    }
    toast(
      "ok",
      d.booking.status === "CONFIRMED"
        ? "Booked — see you soon!"
        : "Request sent to the host",
    );
    setRange(null);
    load();
  };

  const inSel = (date: string) => {
    const s = range?.start;
    const e = range?.end || hover;
    return s && e && date >= s && date <= e;
  };

  return (
    <Card className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-mist">
        Book this stay
      </p>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-white">
            {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" onClick={() => setMonth(new Date(y, m - 1, 1))}>
              ←
            </Button>
            <Button variant="ghost" onClick={() => setMonth(new Date(y, m + 1, 1))}>
              →
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] uppercase text-mist">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div key={d}>{d}</div>
          ))}
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`p${i}`} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const date = iso(d);
            const dis = date < today || unavailable.has(date);
            return (
              <button
                key={d}
                disabled={dis}
                onClick={() => pick(d)}
                onMouseEnter={() => setHover(date)}
                className={`rounded-md py-1.5 text-[11px] transition-colors ${
                  dis
                    ? "cursor-not-allowed text-mist/30 line-through"
                    : inSel(date)
                      ? "bg-gold/50 text-white"
                      : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <Field label="Guests">
        <Select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
          {Array.from({ length: property.max_guests ?? 6 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Select>
      </Field>
      {nights.length > 0 && (
        <div className="space-y-1 rounded-2xl bg-ink-deep/50 p-4 text-sm">
          <div className="flex justify-between text-mist">
            <span>
              {priceFmt.format(nightly)} × {nights.length} nights
            </span>
            <span className="text-white">{priceFmt.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Cleaning fee</span>
            <span className="text-white">{priceFmt.format(cleaning)}</span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Taxes (12%)</span>
            <span className="text-white">{priceFmt.format(taxes)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base">
            <span className="text-mist">Total</span>
            <span className="font-semibold text-gold-bright">
              {priceFmt.format(total)}
            </span>
          </div>
        </div>
      )}
      {blockedInside && (
        <p className="text-xs text-red-300">
          Some selected days are unavailable — pick different dates.
        </p>
      )}
      <Button
        className="w-full"
        loading={busy}
        disabled={!range?.end || blockedInside}
        onClick={book}
      >
        {property.instant_book ? "Book now" : "Request to book"}
      </Button>
      <p className="text-center text-[11px] text-mist/60">
        {property.instant_book
          ? "Charged on confirmation · "
          : "Host approval required · "}
        {property.cancellation_policy ?? "moderate"} cancellation
      </p>
    </Card>
  );
}
