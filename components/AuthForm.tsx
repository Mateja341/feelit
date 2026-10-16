"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);
    setMessage(
      error
        ? error.message
        : mode === "sign-in"
          ? "Signed in. Welcome back to Feelit."
          : "Check your inbox to confirm your account.",
    );
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
          minLength={6}
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
