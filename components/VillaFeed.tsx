"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Villa } from "@/lib/types";
import { priceFmt } from "@/lib/format";

const VillaCanvas = dynamic(() => import("./VillaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-mist">
      Preparing 3D preview…
    </div>
  ),
});

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price · low to high" },
  { key: "price-desc", label: "Price · high to low" },
  { key: "rating", label: "Rating" },
];

function VillaCard({
  villa,
  onSelect,
}: {
  villa: Villa;
  onSelect: () => void;
}) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [8, -8]), {
    stiffness: 220,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-8, 8]), {
    stiffness: 220,
    damping: 24,
  });

  return (
    <motion.button
      layoutId={`villa-card-${villa.id}`}
      onClick={onSelect}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="glass group relative overflow-hidden rounded-3xl p-0 text-left [perspective:1000px] focus-visible:outline-none"
    >
      {/* visual header */}
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{
          background: `radial-gradient(120% 140% at 20% 0%, ${villa.accent}33 0%, #0f172a 65%)`,
        }}
      >
        {villa.image_url ? (
          <img
            src={villa.image_url}
            alt={villa.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-5xl italic text-white/10 transition-colors duration-500 group-hover:text-white/20">
              {villa.name.slice(0, 1)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute bottom-3 left-4 rounded-full bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold-bright backdrop-blur">
          {villa.location}
        </div>
        <div className="absolute right-4 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-gold-bright backdrop-blur">
          ★ {villa.rating.toFixed(2)}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl text-slate-100">{villa.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">
          {villa.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gold-bright">
            {priceFmt.format(villa.price_per_night)}
            <span className="ml-1 text-[10px] font-normal uppercase tracking-widest text-mist">
              / night
            </span>
          </span>
          <span className="text-[11px] text-mist">
            {villa.bedrooms} bd · {villa.guests} guests
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function ExpandedVilla({
  villa,
  onClose,
}: {
  villa: Villa;
  onClose: () => void;
}) {
  return (
    <motion.div
      layoutId={`villa-card-${villa.id}`}
      transition={{ type: "spring", stiffness: 220, damping: 30 }}
      className="glass-strong relative z-10 grid max-h-[85vh] w-[min(56rem,92vw)] grid-cols-1 overflow-hidden rounded-3xl md:grid-cols-2"
    >
      <div className="relative h-64 md:h-auto">
        <VillaCanvas accent={villa.accent} model={villa.model} />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.35em] text-mist">
          Interactive 3D preview
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto p-7">
        <button
          onClick={onClose}
          aria-label="Close"
          className="gold-border absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gold-bright transition-colors hover:bg-gold/15"
        >
          ✕
        </button>
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
          {villa.location}
        </p>
        <h3 className="mt-2 font-display text-3xl text-slate-100">
          {villa.name}
        </h3>
        <div className="hairline my-5" />
        <p className="line-clamp-4 text-sm leading-relaxed text-slate-300">
          {villa.description}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            ["Bedrooms", String(villa.bedrooms)],
            ["Guests", String(villa.guests)],
            ["Rating", `★ ${villa.rating.toFixed(1)}`],
          ].map(([label, value]) => (
            <div key={label} className="glass rounded-xl px-2 py-3">
              <div className="text-lg font-semibold text-gold-bright">
                {value}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-mist">
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-6">
          <div>
            <div className="text-2xl font-semibold text-gold-bright">
              {priceFmt.format(villa.price_per_night)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-mist">
              per night
            </div>
          </div>
          <Link
            href={`/villas/${villa.id}`}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink-deep transition-transform hover:scale-105"
          >
            View residence
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function VillaFeed({ villas }: { villas: Villa[] }) {
  const [selected, setSelected] = useState<Villa | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? villas.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.location.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q),
        )
      : [...villas];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case "price-desc":
        list.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [villas, query, sort]);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  return (
    <section id="villas" className="relative mx-auto max-w-6xl px-6 pb-20 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-10 text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
          The Collection
        </p>
        <h2 className="mt-3 font-display text-4xl text-slate-100 sm:text-5xl">
          Villas worth <span className="gold-text italic">feeling</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-mist">
          Select a residence to open its interactive 3D preview.
        </p>
      </motion.div>

      {/* search + sort */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mb-8 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div className="glass flex flex-1 items-center gap-3 rounded-full px-5 py-2.5">
          <span className="text-gold">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations, villas, experiences…"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-mist transition-colors hover:text-gold-bright"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="glass rounded-full bg-ink px-5 py-2.5 text-sm text-slate-200"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key} className="bg-ink">
              {s.label}
            </option>
          ))}
        </select>
      </motion.div>

      {filtered.length === 0 ? (
        <p className="glass mx-auto max-w-md rounded-2xl p-8 text-center text-sm text-mist">
          No residences match “{query}” — try a destination or villa name.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.1 }}
            >
              <VillaCard villa={v} onSelect={() => setSelected(v)} />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-deep/80 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ExpandedVilla villa={selected} onClose={() => setSelected(null)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
