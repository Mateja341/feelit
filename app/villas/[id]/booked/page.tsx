import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SessionIdChip from "@/components/SessionIdChip";
import Link from "next/link";
import { getVillaById } from "@/lib/villas";

export const metadata = {
  title: "Reservation received — Feelit",
};

async function Confirmation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const villa = await getVillaById(id);
  return (
    <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
        Deposit received
      </p>
      <h1 className="mt-4 font-display text-4xl text-slate-100 sm:text-5xl">
        {villa ? villa.name : "Your stay"} is{" "}
        <span className="gold-text italic">reserved</span>
      </h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-mist">
        Your deposit is held securely. A Feelit concierge will confirm your
        dates within 24 hours and arrange every detail of your arrival — the
        balance is due 30 days before check-in.
      </p>
      <Suspense fallback={null}>
        <SessionIdChip />
      </Suspense>
      <div className="mt-10 flex gap-4">
        <Link
          href="/"
          className="gold-border rounded-full px-6 py-2.5 text-sm text-gold-bright transition-colors hover:bg-gold/10"
        >
          Back to collection
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink-deep transition-transform hover:scale-105"
        >
          My stays
        </Link>
      </div>
    </section>
  );
}

export default function BookedPage({
  params,
}: PageProps<"/villas/[id]/booked">) {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora left-[20%] top-[10%] h-[30rem] w-[30rem] bg-gold/30" />
      <Suspense fallback={null}>
        <Confirmation params={params} />
      </Suspense>
    </main>
  );
}
