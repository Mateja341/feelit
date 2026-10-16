"use client";

import { motion } from "framer-motion";
import type { Experience } from "@/lib/types";
import { priceFmt } from "@/lib/format";

export default function Experiences({
  experiences,
}: {
  experiences: Experience[];
}) {
  return (
    <section
      id="experiences"
      className="relative mx-auto max-w-6xl px-6 pb-32 pt-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
          Beyond the Residence
        </p>
        <h2 className="mt-3 font-display text-4xl text-slate-100 sm:text-5xl">
          Curated <span className="gold-text italic">experiences</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-mist">
          Private chefs, yachts, helicopters and harvests — arranged by your
          concierge for any stay.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {experiences.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="glass group relative flex flex-col overflow-hidden rounded-3xl p-6"
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${e.accent}, transparent)`,
              }}
            />
            <div
              className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl text-lg"
              style={{ background: `${e.accent}22`, color: e.accent }}
            >
              ✦
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-mist">
              {e.location} · {e.duration}
            </p>
            <h3 className="mt-2 font-display text-xl leading-snug text-slate-100">
              {e.title}
            </h3>
            <p className="mt-3 flex-1 text-xs leading-relaxed text-mist">
              {e.blurb}
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-gold-bright">
                {priceFmt.format(e.price)}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors group-hover:text-gold-bright">
                Arrange →
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
