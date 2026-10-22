"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Field, Input, useToast } from "./ui";
import { priceFmt } from "@/lib/format";

type Range = { start: string; end: string };
type Block = { id: string; start_date: string; end_date: string; reason: string };
type Rule = { id: string; date: string; price: number };

/** Host per-property month calendar: block/unblock ranges, per-day prices, bookings. */
export default function PropertyCalendar({ propertyId }: { propertyId: string }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [range, setRange] = useState<Range | null>(null);
  const [priceDay, setPriceDay] = useState<string | null>(null);
  const [priceVal, setPriceVal] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    const res = await fetch(`/api/availability/${propertyId}`);
    const d = await res.json();
    setBlocks(d.blocks ?? []);
    setBookings(d.bookings ?? []);
    setRules(d.price_rules ?? []);
  }, [propertyId]);
  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-start
  const days = new Date(y, m + 1, 0).getDate();
  const iso = (d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const dayInfo = (d: number) => {
    const date = iso(d);
    const booked = bookings.some(
      (b) => date >= b.check_in && date < b.check_out,
    );
    const blocked = blocks.some(
      (b) =>
        b.reason === "HOST_BLOCKED" &&
        date >= b.start_date &&
        date <= b.end_date,
    );
    const rule = rules.find((r) => r.date === date);
    return { date, booked, blocked, price: rule?.price };
  };

  const pick = (d: number) => {
    const { date } = dayInfo(d);
    if (date < today) return;
    if (!range || (range.start && range.end)) setRange({ start: date, end: "" });
    else if (date >= range.start) setRange({ ...range, end: date });
    else setRange({ start: date, end: "" });
  };

  const call = async (body: object) => {
    const res = await fetch(`/api/availability/${propertyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) return toast("err", d.error ?? "failed");
    toast("ok", "Saved");
    setRange(null);
    setPriceDay(null);
    setPriceVal("");
    load();
  };

  const inRange = (date: string) =>
    range?.start && range.end && date >= range.start && date <= range.end;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-xl text-white">
          {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setMonth(new Date(y, m - 1, 1))}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMonth(new Date(y, m + 1, 1))}
          >
            →
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-mist">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`p${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const info = dayInfo(d);
          const cls = info.booked
            ? "bg-gold/30 text-gold-bright"
            : info.blocked
              ? "bg-red-500/20 text-red-300 line-through"
              : info.date < today
                ? "text-mist/30"
                : inRange(info.date)
                  ? "bg-gold/40 text-white"
                  : "text-slate-200 hover:bg-white/10";
          return (
            <button
              key={d}
              onClick={() => pick(d)}
              className={`rounded-lg py-2 text-xs transition-colors ${cls}`}
              title={info.price ? `Custom ${info.price}` : undefined}
            >
              {d}
              {info.price && (
                <span className="block text-[8px] text-gold-bright">
                  {info.price}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest">
        <span className="flex items-center gap-1 text-mist">
          <span className="h-2 w-2 rounded bg-gold/50" /> Booked
        </span>
        <span className="flex items-center gap-1 text-mist">
          <span className="h-2 w-2 rounded bg-red-500/40" /> Blocked
        </span>
        <span className="flex items-center gap-1 text-mist">
          <span className="h-2 w-2 rounded bg-white/20" /> Custom price
        </span>
      </div>
      {range?.start && range.end && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-ink-deep/40 p-4">
          <span className="text-sm text-white">
            {range.start} → {range.end}
          </span>
          <Button onClick={() => call({ action: "block", ...range })}>
            Block dates
          </Button>
          <Button
            variant="outline"
            onClick={() => call({ action: "unblock", ...range })}
          >
            Unblock
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="number"
              placeholder="Price/day"
              className="w-28"
              value={priceVal}
              onChange={(e) => setPriceVal(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() =>
                call({ action: "price", ...range, price: Number(priceVal) })
              }
            >
              Set price
            </Button>
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-mist/60">
        Click a start and end date to block, unblock, or price a range.
      </p>
    </Card>
  );
}
