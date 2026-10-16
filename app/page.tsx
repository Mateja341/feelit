import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VillaFeed from "@/components/VillaFeed";
import Experiences from "@/components/Experiences";
import { getVillas, EXPERIENCES } from "@/lib/villas";

async function VillaFeedSection() {
  const villas = await getVillas();
  return <VillaFeed villas={villas} />;
}

function VillaFeedSkeleton() {
  return (
    <section id="villas" className="mx-auto max-w-6xl px-6 pb-32 pt-8">
      <div className="mb-12 text-center">
        <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
          The Collection
        </p>
        <h2 className="mt-3 font-display text-4xl text-slate-100 sm:text-5xl">
          Villas worth <span className="gold-text italic">feeling</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass h-72 animate-pulse rounded-3xl bg-white/5"
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <Hero />
      <Suspense fallback={<VillaFeedSkeleton />}>
        <VillaFeedSection />
      </Suspense>
      <Experiences experiences={EXPERIENCES} />
      <footer className="border-t border-white/5 px-6 py-10 text-center text-[11px] uppercase tracking-[0.3em] text-mist">
        <span className="gold-text font-display text-base normal-case tracking-normal">
          Feelit
        </span>
        <p className="mt-3">Curated villas · Extraordinary stays · Est. 2026</p>
      </footer>
    </main>
  );
}
