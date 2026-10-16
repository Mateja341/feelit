"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Villa } from "@/lib/types";
import { priceFmt } from "@/lib/format";
import BookingCard from "./BookingCard";

const VillaCanvas = dynamic(() => import("./VillaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-mist">
      Preparing 3D preview…
    </div>
  ),
});

export default function VillaDetail({
  villa,
  related,
}: {
  villa: Villa;
  related: Villa[];
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-32">
      <div
        className="aurora right-[-10%] top-[5%] h-[30rem] w-[30rem]"
        style={{ background: `${villa.accent}40` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <Link
            href="/#villas"
            className="text-[11px] uppercase tracking-[0.3em] text-mist transition-colors hover:text-gold-bright"
          >
            ← The Collection
          </Link>
          <p className="mt-4 text-[11px] uppercase tracking-[0.4em] text-gold">
            {villa.location}
          </p>
          <h1 className="mt-2 font-display text-4xl text-slate-100 sm:text-6xl">
            {villa.name}
          </h1>
        </div>
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm">
          <span className="font-semibold text-gold-bright">
            ★ {villa.rating.toFixed(2)}
          </span>
          <span className="text-mist">·</span>
          <span className="text-mist">
            {villa.bedrooms} bd · {villa.bathrooms} ba · {villa.guests} guests
          </span>
        </div>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          {/* 3D hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="glass relative h-[26rem] overflow-hidden rounded-3xl sm:h-[30rem]"
          >
            <VillaCanvas accent={villa.accent} model={villa.model} />
            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[10px] uppercase tracking-[0.35em] text-mist">
              Interactive 3D residence preview
            </div>
          </motion.div>

          {/* description */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8"
          >
            <h2 className="font-display text-2xl text-slate-100">
              The residence
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {villa.description}
            </p>
          </motion.div>

          {/* amenities */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8"
          >
            <h2 className="font-display text-2xl text-slate-100">Amenities</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {villa.amenities.map((a) => (
                <span
                  key={a}
                  className="glass rounded-full px-4 py-2 text-xs text-slate-200"
                >
                  {a}
                </span>
              ))}
            </div>
          </motion.div>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              ["Bedrooms", String(villa.bedrooms)],
              ["Bathrooms", String(villa.bathrooms)],
              ["Guests", String(villa.guests)],
              ["Nightly", priceFmt.format(villa.price_per_night)],
            ].map(([label, value]) => (
              <div key={label} className="glass rounded-2xl px-4 py-5 text-center">
                <div className="text-xl font-semibold text-gold-bright">
                  {value}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-mist">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <BookingCard villa={villa} />
      </div>

      {/* related */}
      {related.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24"
        >
          <h2 className="font-display text-3xl text-slate-100">
            You may also <span className="gold-text italic">feel</span>
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/villas/${r.id}`}
                className="glass group overflow-hidden rounded-3xl transition-transform hover:-translate-y-1"
              >
                <div
                  className="relative flex h-32 items-center justify-center overflow-hidden"
                  style={{
                    background: `radial-gradient(120% 140% at 20% 0%, ${r.accent}33 0%, #0f172a 65%)`,
                  }}
                >
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <span className="font-display text-4xl italic text-white/10 transition-colors group-hover:text-white/20">
                      {r.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gold">
                    {r.location}
                  </div>
                  <div className="mt-1 font-display text-lg text-slate-100">
                    {r.name}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gold-bright">
                    {priceFmt.format(r.price_per_night)}
                    <span className="ml-1 text-[10px] font-normal uppercase text-mist">
                      / night
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
