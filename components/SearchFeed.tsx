"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { Villa } from "@/lib/types";
import { priceFmt } from "@/lib/format";
import {
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  GuestsIcon,
  StarIcon,
  HeartIcon,
  CloseIcon,
  PlusIcon,
  MinusIcon,
} from "./icons";

const VillaCanvas = dynamic(() => import("./VillaCanvas"), { ssr: false });

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const MONTH_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const AMENITY_FILTERS = ["Pool", "Spa", "Chef", "3D Tour"] as const;

function pseudoDistance(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return (0.3 + (h % 42) / 10).toFixed(1);
}

/* ---------- calendar widget ---------- */

function CalendarWidget({
  range,
  onChange,
}: {
  range: [number | null, number | null];
  onChange: (r: [number | null, number | null]) => void;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const monthName = first.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const pick = (d: number) => {
    const [s, e] = range;
    if (s === null || (s !== null && e !== null)) return onChange([d, null]);
    if (d < s) return onChange([d, s]);
    onChange([s, d]);
  };

  const inRange = (d: number) => {
    const [s, e] = range;
    if (s === null) return false;
    if (e === null) return d === s;
    return d >= s && d <= e;
  };

  return (
    <div className="glass w-64 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {monthName}
        </span>
        <CalendarIcon className="h-4 w-4 text-gold-bright" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-mist/70">
        {MONTH_DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`x${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const active = inRange(d);
          const edge = range[0] === d || range[1] === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => pick(d)}
              className={`aspect-square rounded-lg text-[11px] transition-all ${
                edge
                  ? "bg-gold text-ink font-bold shadow-[0_0_14px_-2px_rgba(168,85,247,0.9)]"
                  : active
                    ? "bg-gold/40 text-white"
                    : "text-mist hover:bg-white/10 hover:text-white"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- guests widget ---------- */

function GuestsWidget({
  guests,
  onChange,
}: {
  guests: { adults: number; children: number; rooms: number };
  onChange: (g: typeof guests) => void;
}) {
  const [open, setOpen] = useState(false);
  const row = (
    label: string,
    key: keyof typeof guests,
    min = 0
  ) => (
    <div className="flex items-center justify-between py-2" key={key}>
      <span className="text-sm text-mist">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            onChange({ ...guests, [key]: Math.max(min, guests[key] - 1) })
          }
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-mist transition-colors hover:border-gold/60 hover:text-white"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm font-semibold text-white">
          {guests[key]}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...guests, [key]: guests[key] + 1 })}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-mist transition-colors hover:border-gold/60 hover:text-white"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`glass flex w-64 items-center justify-between rounded-2xl p-4 text-left transition-all ${
          open ? "border-gold/60 shadow-[0_0_28px_-8px_rgba(168,85,247,0.7)]" : ""
        }`}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Guests & rooms
          </div>
          <div className="mt-1 text-[11px] text-mist">
            {guests.adults} adults · {guests.children} children · {guests.rooms}{" "}
            rooms
          </div>
        </div>
        <GuestsIcon className="h-5 w-5 text-gold-bright" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="glass-strong absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl p-4"
          >
            {row("Adults", "adults", 1)}
            {row("Children", "children")}
            {row("Rooms", "rooms", 1)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- listing card ---------- */

function ListingCard({
  villa,
  liked,
  expanded,
  onLike,
  onToggleExpand,
}: {
  villa: Villa;
  liked: boolean;
  expanded: boolean;
  onLike: () => void;
  onToggleExpand: () => void;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), {
    stiffness: 200,
    damping: 25,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), {
    stiffness: 200,
    damping: 25,
  });

  return (
    <motion.div
      layout
      onMouseMove={(e) => {
        if (expanded) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={
        expanded
          ? { transformStyle: "preserve-3d" }
          : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }
      }
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className="group relative cursor-pointer [perspective:1400px]"
      onClick={onToggleExpand}
    >
      {/* extruded underside — the "3D rectangle" body behind the post face */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-3 left-3 right-3 top-4 rounded-3xl border border-gold/25 bg-[#0a0c1e] shadow-[0_30px_80px_-20px_rgba(110,58,255,0.5)]"
            style={{ transform: "translateZ(-60px) rotateX(6deg)" }}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={`glass relative overflow-hidden rounded-3xl p-4 ${
          expanded
            ? "shadow-[0_0_60px_-12px_rgba(110,58,255,0.6)]"
            : ""
        }`}
        style={
          expanded
            ? { transform: "rotateX(5deg) translateZ(20px)", transformStyle: "preserve-3d" }
            : undefined
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col"
            >
              {/* top face of the extruded block — platform + 3D projection */}
              <div className="relative h-72 [perspective:900px]">
                {/* platform top plane */}
                <div
                  className="absolute bottom-4 left-1/2 h-44 w-[82%] rounded-full border border-gold/30 bg-gradient-to-b from-ink-soft to-ink-deep"
                  style={{
                    transform: "translateX(-50%) rotateX(64deg)",
                    boxShadow:
                      "0 0 60px rgba(110,58,255,0.4), inset 0 0 60px rgba(110,58,255,0.15)",
                  }}
                />
                {/* hologram glow under the model */}
                <div
                  className="absolute bottom-8 left-1/2 h-24 w-1/2 rounded-full bg-gold/25 blur-3xl"
                  style={{ transform: "translateX(-50%) rotateX(64deg)" }}
                />
                <div className="absolute inset-0 bottom-2">
                  <VillaCanvas
                    accent={villa.accent}
                    model={villa.model}
                    interactive
                  />
                </div>
                <p className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-mist/60">
                  Drag to orbit · scroll to zoom
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur transition-colors hover:text-gold-bright"
                  aria-label="Collapse"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              {/* front face info */}
              <div className="mt-2 flex items-end justify-between gap-4 px-1 pb-1">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                    {villa.location} · {pseudoDistance(villa.id)} km from center
                  </p>
                  <h3 className="font-display mt-1 truncate text-2xl text-white">
                    {villa.name}
                  </h3>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-lg font-semibold text-gold-bright">
                    {priceFmt.format(villa.price_per_night)}
                  </span>
                  <span className="block text-[10px] uppercase tracking-widest text-mist">
                    / night
                  </span>
                </div>
              </div>
              <div className="hairline my-3" />
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-0.5 text-gold-bright">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(villa.rating) ? "" : "opacity-25"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">
                    {villa.rating.toFixed(2)}{" "}
                    <span className="text-gold-bright">★</span>
                  </span>
                  <Link
                    href={`/villas/${villa.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-xl bg-gold px-4 py-2 text-[11px] font-semibold tracking-widest text-ink transition-all hover:bg-gold-bright hover:shadow-[0_0_24px_-4px_rgba(168,85,247,0.9)]"
                  >
                    VIEW →
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex gap-5"
            >
              {/* image */}
              <div className="relative h-40 w-56 shrink-0 overflow-hidden rounded-2xl">
                {villa.image_url ? (
                  <img
                    src={villa.image_url}
                    alt={villa.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background: `radial-gradient(120% 140% at 20% 0%, ${villa.accent}33 0%, #0b0d1b 65%)`,
                    }}
                  >
                    <span className="font-display text-5xl italic text-white/10">
                      {villa.name.slice(0, 1)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                  }}
                  aria-label="Save to favorites"
                  className={`absolute right-2.5 top-2.5 rounded-full p-2 backdrop-blur transition-all ${
                    liked
                      ? "bg-gold/80 text-ink"
                      : "bg-black/40 text-white/80 hover:text-gold-bright"
                  }`}
                >
                  <HeartIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* info */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white">
                      {villa.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-mist">
                      {villa.location} · {pseudoDistance(villa.id)} km from
                      center
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-semibold text-gold-bright">
                      {priceFmt.format(villa.price_per_night)}
                    </span>
                    <span className="block text-[10px] uppercase tracking-widest text-mist">
                      / night
                    </span>
                  </div>
                </div>

                <div className="hairline my-3" />

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center gap-0.5 text-gold-bright">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < Math.round(villa.rating) ? "" : "opacity-25"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {villa.rating.toFixed(2)}{" "}
                    <span className="text-gold-bright">★</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ---------- filter panel ---------- */

function FilterPanel({
  open,
  onClose,
  maxPrice,
  setMaxPrice,
  amenities,
  toggleAmenity,
  only3d,
  setOnly3d,
}: {
  open: boolean;
  onClose: () => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  amenities: string[];
  toggleAmenity: (a: string) => void;
  only3d: boolean;
  setOnly3d: (b: boolean) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-ink-deep/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="glass-strong fixed right-0 top-0 z-[80] flex h-full w-80 flex-col p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
                Filters
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-mist transition-colors hover:text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-mist">
                <span>Max price / night</span>
                <span className="font-semibold text-gold-bright">
                  {priceFmt.format(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={25000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-mist">
                Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_FILTERS.map((a) => {
                  const active = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition-all ${
                        active
                          ? "border-gold bg-gold/25 text-white shadow-[0_0_16px_-4px_rgba(168,85,247,0.8)]"
                          : "border-white/15 text-mist hover:border-gold/40 hover:text-white"
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between text-sm text-mist">
              Villas with 3D tour only
              <span
                onClick={() => setOnly3d(!only3d)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  only3d ? "bg-gold" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    only3d ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </span>
            </label>

            <div className="mt-auto">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-gold py-3 text-sm font-semibold tracking-widest text-ink transition-colors hover:bg-gold-bright"
              >
                APPLY FILTERS
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------- main feed ---------- */

export default function SearchFeed({ villas }: { villas: Villa[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [range, setRange] = useState<[number | null, number | null]>([
    null,
    null,
  ]);
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [only3d, setOnly3d] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = villas.filter(
      (v) =>
        v.price_per_night <= maxPrice &&
        (!q ||
          v.name.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q)) &&
        amenities.every((a) => {
          if (a === "3D Tour") return true; // every villa ships a 3D model
          if (a === "Pool")
            return v.amenities.some((x) => /pool|spa|onsen|hammam/i.test(x));
          if (a === "Spa")
            return v.amenities.some((x) => /spa|hammam|onsen|healer/i.test(x));
          if (a === "Chef")
            return v.amenities.some((x) => /chef|kitchen|sommelier|wine/i.test(x));
          return true;
        }) &&
        guests.adults + guests.children <= v.guests
    );
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price_per_night - b.price_per_night);
      case "price-desc":
        return [...list].sort((a, b) => b.price_per_night - a.price_per_night);
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [villas, query, sort, maxPrice, amenities, guests]);

  const toggleLike = (id: string) =>
    setLiked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleAmenity = (a: string) =>
    setAmenities((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-28">
      {/* search row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-5 flex items-center gap-3"
      >
        <div className="glass flex flex-1 items-center rounded-2xl transition-all focus-within:border-gold/60 focus-within:shadow-[0_0_28px_-8px_rgba(168,85,247,0.7)]">
          <SearchIcon className="ml-4 h-4.5 w-4.5 shrink-0 text-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations, villas…"
            className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-mist/60"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="glass flex items-center gap-2 rounded-2xl px-4 py-3.5 text-sm text-mist transition-all hover:border-gold/50 hover:text-white"
        >
          <FilterIcon className="h-4 w-4" /> Filter
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="glass cursor-pointer rounded-2xl bg-transparent px-4 py-3.5 text-sm text-mist transition-colors hover:text-white [&>option]:bg-ink"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="rating">Top rated</option>
        </select>
      </motion.div>

      {/* widgets row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="mb-10 flex flex-wrap items-start gap-4"
      >
        <CalendarWidget range={range} onChange={setRange} />
        <GuestsWidget guests={guests} onChange={setGuests} />
      </motion.div>

      {/* listings */}
      <div className="space-y-5 [perspective:1200px]">
        {filtered.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <ListingCard
              villa={v}
              liked={liked.has(v.id)}
              expanded={expandedId === v.id}
              onLike={() => toggleLike(v.id)}
              onToggleExpand={() =>
                setExpandedId((cur) => (cur === v.id ? null : v.id))
              }
            />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="glass rounded-3xl py-16 text-center text-sm text-mist">
            No residences match your search — try widening the filters.
          </p>
        )}
      </div>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        amenities={amenities}
        toggleAmenity={toggleAmenity}
        only3d={only3d}
        setOnly3d={setOnly3d}
      />
    </div>
  );
}
