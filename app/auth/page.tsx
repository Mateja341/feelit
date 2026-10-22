import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign in — Feelit",
};

export default function AuthPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora left-[-10%] top-[20%] h-[30rem] w-[30rem] bg-gold/30" />
      <section className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-32">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
            Members
          </p>
          <h1 className="mt-3 font-display text-4xl text-slate-100">
            Enter <span className="gold-text italic">Feelit</span>
          </h1>
        </div>
        <Suspense>
          <AuthForm />
        </Suspense>
      </section>
    </main>
  );
}
