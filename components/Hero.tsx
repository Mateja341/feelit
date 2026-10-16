"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback } from "react";

type Journey = "guest" | "owner";

const journeys: {
  id: Journey;
  kicker: string;
  title: string;
  copy: string;
  cta: string;
}[] = [
  {
    id: "guest",
    kicker: "For Guests",
    title: "Explore the Collection",
    copy: "Private estates, overwater residences and alpine chalets — each verified by a Feelit curator.",
    cta: "Browse villas",
  },
  {
    id: "owner",
    kicker: "For Owners",
    title: "List Your Property",
    copy: "Join an invitation-grade marketplace. A one-time $49 listing fee places your villa before our members.",
    cta: "Begin onboarding",
  },
];

export default function Hero() {
  const scrollToFeed = useCallback(() => {
    document
      .getElementById("villas")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24">
      {/* ambient background */}
      <div className="aurora left-[-10%] top-[-20%] h-[34rem] w-[34rem] bg-gold/40" />
      <div className="aurora right-[-15%] bottom-[-10%] h-[40rem] w-[40rem] bg-ink-soft" />
      <div className="aurora left-[30%] top-[40%] h-[28rem] w-[28rem] bg-gold-dim/30" />

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className="mb-6 text-[11px] uppercase tracking-[0.5em] text-gold"
      >
        Feelit · Curated Stays
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="max-w-4xl text-center font-display text-5xl leading-[1.08] text-slate-100 sm:text-7xl"
      >
        Luxury you can <span className="gold-text italic">feel</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="mt-6 max-w-xl text-center text-base leading-relaxed text-mist"
      >
        A private marketplace of extraordinary villas and experiences. Choose
        your journey below.
      </motion.p>

      {/* Dual journey selection */}
      <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {journeys.map((j, i) => {
          const inner = (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65 + i * 0.15 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass group relative h-full cursor-pointer overflow-hidden rounded-3xl p-7 text-left transition-shadow hover:shadow-[0_20px_80px_-20px_rgba(212,175,55,0.4)]"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="aurora right-[-30%] top-[-30%] h-48 w-48 bg-gold/60 opacity-40" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                {j.kicker}
              </p>
              <h2 className="mt-3 font-display text-2xl text-slate-100">
                {j.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">{j.copy}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gold-bright">
                {j.cta}
                <motion.span
                  className="inline-block"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 4 }}
                >
                  →
                </motion.span>
              </div>
            </motion.div>
          );

          return j.id === "guest" ? (
            <button
              key={j.id}
              onClick={scrollToFeed}
              className="text-left focus-visible:outline-none"
            >
              {inner}
            </button>
          ) : (
            <Link key={j.id} href="/host" className="block">
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
