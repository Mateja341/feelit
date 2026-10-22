"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [rolePick, setRolePick] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  if (!isSupabaseConfigured) {
    return (
      <div className="glass mt-10 rounded-3xl p-8 text-center">
        <p className="text-sm text-slate-300">
          Supabase is not configured yet.
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-mist">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
          .env.local to enable authentication.
        </p>
      </div>
    );
  }

  // After sign-up: let the new user pick their role and enter onboarding.
  if (rolePick) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mt-10 rounded-3xl p-8"
      >
        <p className="text-center text-[11px] uppercase tracking-[0.4em] text-gold">
          One last thing
        </p>
        <p className="mt-2 text-center text-sm text-mist">
          How will you use Feelit?
        </p>
        <div className="mt-6 grid gap-3">
          <button
            onClick={() => router.push("/onboarding/guest")}
            className="glass rounded-2xl p-5 text-left transition-all hover:border-gold hover:shadow-[0_0_24px_-6px_rgba(168,85,247,0.7)]"
          >
            <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-white">
              I want to rent a property
            </span>
            <span className="mt-1 block text-xs text-mist">
              Book extraordinary stays as a guest
            </span>
          </button>
          <button
            onClick={() => router.push("/onboarding/host")}
            className="glass rounded-2xl p-5 text-left transition-all hover:border-gold hover:shadow-[0_0_24px_-6px_rgba(168,85,247,0.7)]"
          >
            <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-white">
              I want to list my property
            </span>
            <span className="mt-1 block text-xs text-mist">
              Rent out your place as a host
            </span>
          </button>
        </div>
        <button
          onClick={() => router.push("/search")}
          className="mt-4 w-full text-center text-xs text-mist hover:text-gold-bright"
        >
          Skip for now →
        </button>
      </motion.div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (mode === "sign-up" && password.length < 10) {
      setBusy(false);
      setMessage("Password needs at least 10 characters.");
      return;
    }

    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (mode === "sign-in") {
      router.push(next ?? "/search");
      router.refresh();
    } else {
      setRolePick(true);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15 }}
      onSubmit={onSubmit}
      className="glass mt-10 flex flex-col gap-5 rounded-3xl p-8"
    >
      <div className="mx-auto flex rounded-full bg-white/5 p-1 text-xs">
        {(["sign-in", "sign-up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-5 py-1.5 capitalize transition-colors ${
              mode === m ? "bg-gold text-ink-deep font-bold" : "text-mist"
            }`}
          >
            {m === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-mist">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold/60"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-mist">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "sign-up" ? 10 : 6}
          placeholder="••••••••"
          className="glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold/60"
        />
      </label>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={busy}
        className="mt-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-ink-deep disabled:opacity-50"
      >
        {busy
          ? "Working…"
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </motion.button>

      {message && (
        <p className="text-center text-xs leading-relaxed text-mist">
          {message}
        </p>
      )}
    </motion.form>
  );
}
