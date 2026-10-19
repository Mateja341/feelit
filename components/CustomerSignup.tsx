"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  GoogleLogo,
  AppleLogo,
} from "./icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-mist/60 transition-all focus:border-gold/70 focus:bg-white/[0.07] focus:shadow-[0_0_24px_-6px_rgba(168,85,247,0.5)]";

export default function CustomerSignup({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    nickname: "",
    email: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.name.trim() &&
    form.surname.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 6 &&
    agree;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: `${form.name} ${form.surname}`.trim(),
            nickname: form.nickname,
            role: "customer",
          },
        },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }
    setSent(true);
    setLoading(false);
  }

  async function oauth(provider: "google" | "apple") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/search` },
    });
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong mx-auto max-w-md rounded-3xl p-10 text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 shadow-[0_0_30px_-4px_rgba(168,85,247,0.6)]">
          <CheckIcon className="h-7 w-7 text-gold-bright" />
        </div>
        <h2 className="font-display mb-3 text-3xl text-white">
          Check your <span className="gold-text italic">inbox</span>
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-mist">
          We sent a verification link to{" "}
          <span className="text-white">{form.email}</span>. Click it to activate
          your account and step inside.
        </p>
        <button
          onClick={() => router.push("/search")}
          className="w-full rounded-xl bg-gold py-3 text-sm font-semibold tracking-widest text-ink transition-colors hover:bg-gold-bright"
        >
          CONTINUE TO FEEL IT.
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong mx-auto w-full max-w-md rounded-3xl p-8 md:p-10"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-xs uppercase tracking-[0.25em] text-mist transition-colors hover:text-white"
      >
        ← Back
      </button>

      <div className="mb-8 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 bg-gold/10 shadow-[0_0_40px_-6px_rgba(168,85,247,0.7)]">
          <UserIcon className="h-9 w-9 text-gold-bright" />
        </div>
      </div>

      <div className="space-y-3.5">
        <input
          className={field}
          placeholder="Name"
          value={form.name}
          onChange={set("name")}
          autoComplete="given-name"
        />
        <input
          className={field}
          placeholder="Surname"
          value={form.surname}
          onChange={set("surname")}
          autoComplete="family-name"
        />
        <input
          className={field}
          placeholder="Nickname"
          value={form.nickname}
          onChange={set("nickname")}
          autoComplete="username"
        />
        <input
          className={field}
          type="email"
          placeholder="Gmail / Email"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
        />
        <div className="relative">
          <input
            className={`${field} pr-11`}
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mist transition-colors hover:text-white"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <EyeOffIcon className="h-4.5 w-4.5" />
            ) : (
              <EyeIcon className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3 text-xs text-mist">
        <span
          onClick={() => setAgree((a) => !a)}
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
            agree
              ? "border-gold bg-gold text-ink shadow-[0_0_14px_-2px_rgba(168,85,247,0.8)]"
              : "border-white/20 bg-white/[0.04]"
          }`}
        >
          {agree && <CheckIcon className="h-3.5 w-3.5" />}
        </span>
        I agree to the{" "}
        <span className="text-white underline decoration-gold/60 underline-offset-2">
          Terms of Use & Privacy Policy
        </span>
      </label>

      {error && (
        <p className="mt-3 text-center text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || loading}
        className="mt-6 w-full rounded-xl bg-gold py-3 text-sm font-semibold tracking-widest text-ink transition-all hover:bg-gold-bright hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.8)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "CREATING…" : "CREATE ACCOUNT"}
      </button>

      <div className="my-5 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-mist/60">
        <span className="hairline flex-1" /> or continue with{" "}
        <span className="hairline flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => oauth("google")}
          className="glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-white transition-all hover:border-gold/50 hover:shadow-[0_0_20px_-6px_rgba(168,85,247,0.6)]"
        >
          <GoogleLogo className="h-4.5 w-4.5" /> Google
        </button>
        <button
          type="button"
          onClick={() => oauth("apple")}
          className="glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-white transition-all hover:border-gold/50 hover:shadow-[0_0_20px_-6px_rgba(168,85,247,0.6)]"
        >
          <AppleLogo className="h-4.5 w-4.5" /> Apple
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-mist">
        Already have an account?{" "}
        <Link
          href="/auth"
          className="text-white underline decoration-gold/60 underline-offset-4 transition-colors hover:text-gold-bright hover:decoration-gold-bright"
        >
          Log in
        </Link>
      </p>
    </motion.form>
  );
}
