import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SessionIdChip from "@/components/SessionIdChip";
import Link from "next/link";

export const metadata = {
  title: "Welcome to Feelit — Host Confirmed",
};

export default function HostSuccessPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora left-[20%] top-[10%] h-[30rem] w-[30rem] bg-gold/30" />
      <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
          Payment received
        </p>
        <h1 className="mt-4 font-display text-4xl text-slate-100 sm:text-5xl">
          Welcome to <span className="gold-text italic">Feelit</span>
        </h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-mist">
          Your listing fee has been received. Once our webhook confirms the
          payment, your villa goes live in the collection — a curator will reach
          out within 48 hours to complete verification.
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
            href="/host"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink-deep transition-transform hover:scale-105"
          >
            List another villa
          </Link>
        </div>
      </section>
    </main>
  );
}
