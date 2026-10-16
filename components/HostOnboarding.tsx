"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

const LISTING_FEE_LABEL = "$49";

type Field = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
  min?: number;
  span?: boolean;
};

const fields: Field[] = [
  {
    name: "name",
    label: "Villa name",
    type: "text",
    placeholder: "Villa Lumière",
    required: true,
    span: true,
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    placeholder: "Saint-Tropez, French Riviera",
    required: true,
  },
  {
    name: "price_per_night",
    label: "Nightly rate (USD)",
    type: "number",
    placeholder: "15000",
    required: true,
    min: 1,
  },
  {
    name: "bedrooms",
    label: "Bedrooms",
    type: "number",
    placeholder: "6",
    required: true,
    min: 1,
  },
  {
    name: "guests",
    label: "Max guests",
    type: "number",
    placeholder: "12",
    required: true,
    min: 1,
  },
];

export default function HostOnboarding() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      location: String(form.get("location") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      price_per_night: Number(form.get("price_per_night")),
      bedrooms: Number(form.get("bedrooms")),
      guests: Number(form.get("guests")),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
          Owner Onboarding
        </p>
        <h1 className="mt-3 font-display text-4xl text-slate-100 sm:text-5xl">
          Present your villa to <span className="gold-text italic">Feelit</span>{" "}
          members
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-mist">
          Describe your property, then complete the one-time {LISTING_FEE_LABEL}{" "}
          listing fee via Stripe Checkout to publish it to the collection.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        onSubmit={onSubmit}
        className="glass mt-12 grid grid-cols-1 gap-5 rounded-3xl p-8 sm:grid-cols-2"
      >
        {fields.map((f) => (
          <label
            key={f.name}
            className={`flex flex-col gap-2 ${f.span ? "sm:col-span-2" : ""}`}
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-mist">
              {f.label}
            </span>
            <input
              name={f.name}
              type={f.type}
              placeholder={f.placeholder}
              required={f.required}
              min={f.min}
              className="glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold/60"
            />
          </label>
        ))}

        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-mist">
            Description
          </span>
          <textarea
            name="description"
            rows={4}
            placeholder="Clifftop estate with cascading infinity pool, private chef, sunset terrace…"
            className="glass resize-none rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold/60"
          />
        </label>

        <div className="hairline sm:col-span-2" />

        <div className="flex flex-col items-center justify-between gap-4 sm:col-span-2 sm:flex-row">
          <div className="text-center sm:text-left">
            <div className="text-xl font-semibold text-gold-bright">
              {LISTING_FEE_LABEL}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-mist">
              one-time listing fee
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gold px-8 py-3 text-sm font-bold text-ink-deep transition-opacity disabled:opacity-50"
          >
            {submitting
              ? "Opening secure checkout…"
              : `Pay ${LISTING_FEE_LABEL} & Continue`}
          </motion.button>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:col-span-2">
            {error}
          </p>
        )}

        <p className="text-center text-[11px] text-mist sm:col-span-2">
          Secured by Stripe. Your villa publishes after payment is confirmed.
        </p>
      </motion.form>
    </section>
  );
}
