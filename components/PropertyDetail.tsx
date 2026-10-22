"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge, Button, Card, useToast } from "./ui";
import { priceFmt } from "@/lib/format";
import BookingPanel from "./BookingPanel";
import MediaSection from "./MediaSection";

/** Detail page for a real `properties` row (host-created listing). */
export default function PropertyDetail({ property }: { property: any }) {
  const p = property;
  const [fav, setFav] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d) => setFav((d.ids ?? []).includes(p.id)));
    fetch(`/api/reviews?property=${p.id}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []));
  }, [p.id]);

  const toggleFav = async () => {
    const next = !fav;
    setFav(next); // optimistic
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: p.id }),
    });
    if (!res.ok) {
      setFav(!next); // rollback
      if (res.status === 401) toast("err", "Sign in to save favorites");
      else toast("err", "Failed");
    }
  };

  const cover =
    p.property_photos?.find((x: any) => x.is_cover)?.url ??
    p.property_photos?.[0]?.url;

  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-32">
      <div
        className="aurora right-[-10%] top-[5%] h-[30rem] w-[30rem]"
        style={{ background: `${p.accent ?? "#a855f7"}40` }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/search"
            className="text-[11px] uppercase tracking-[0.3em] text-mist hover:text-gold-bright"
          >
            ← Back to search
          </Link>
          <p className="mt-4 text-[11px] uppercase tracking-[0.4em] text-gold">
            {[p.city, p.country].filter(Boolean).join(", ")}
          </p>
          <h1 className="mt-2 font-display text-4xl text-slate-100 sm:text-6xl">
            {p.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFav}
            className={`glass flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${
              fav ? "text-gold-bright" : "text-mist hover:text-gold-bright"
            }`}
            aria-label="favorite"
          >
            {fav ? "♥" : "♡"}
          </button>
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <span className="font-semibold text-gold-bright">
              ★ {Number(p.rating ?? 0).toFixed(2)}
            </span>
            <span className="text-mist">·</span>
            <span className="text-mist">
              {p.bedrooms} bd · {p.bathrooms} ba · {p.max_guests} guests
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="glass relative h-[26rem] overflow-hidden rounded-3xl sm:h-[30rem]">
            {cover ? (
              <img
                src={cover}
                alt={p.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full items-center justify-center font-display text-8xl italic text-white/10"
                style={{ background: `${p.accent ?? "#a855f7"}22` }}
              >
                {p.title?.[0]}
              </div>
            )}
          </div>
          {p.property_photos?.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {p.property_photos.slice(1, 5).map((ph: any) => (
                <img
                  key={ph.id}
                  src={ph.url}
                  className="aspect-video w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <h2 className="font-display text-2xl text-slate-100">
              The residence
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {p.description}
            </p>
          </motion.div>

          <div className="mt-8">
            <h2 className="font-display text-2xl text-slate-100">Amenities</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(p.amenities ?? []).map((a: string) => (
                <span
                  key={a}
                  className="glass rounded-full px-4 py-2 text-xs text-slate-200"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-display text-2xl text-slate-100">
              Experience
            </h2>
            <MediaSection
              propertyId={p.id}
              media={p.property_media ?? []}
              canManage={false}
            />
          </div>

          <div className="mt-10">
            <h2 className="mb-4 font-display text-2xl text-slate-100">
              Reviews
            </h2>
            {reviews.map((r) => (
              <Card key={r.id} className="mb-3">
                <div className="flex items-center gap-3">
                  <Badge tone="purple">{"★".repeat(r.rating)}</Badge>
                  <span className="text-xs text-mist">
                    {r.profiles?.first_name ?? "Guest"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">{r.text}</p>
                {r.reply && (
                  <p className="mt-2 rounded-xl bg-white/5 p-3 text-xs text-mist">
                    Host: {r.reply}
                  </p>
                )}
              </Card>
            ))}
            {!reviews.length && (
              <p className="text-sm text-mist">No reviews yet.</p>
            )}
            <ReviewForm propertyId={p.id} onDone={() => {
              fetch(`/api/reviews?property=${p.id}`)
                .then((r) => r.json())
                .then((d) => setReviews(d.reviews ?? []));
            }} />
          </div>
        </div>
        <BookingPanel property={p} />
      </div>
    </section>
  );
}

function ReviewForm({ propertyId, onDone }: { propertyId: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const toast = useToast();
  return (
    <Card className="mt-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
        Leave a review
      </p>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-xl ${n <= rating ? "text-gold-bright" : "text-mist/30"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input w-full"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="How was your stay?"
      />
      <Button
        className="mt-3"
        onClick={async () => {
          const res = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ property_id: propertyId, rating, text }),
          });
          const d = await res.json();
          if (res.ok) {
            toast("ok", "Review posted");
            setText("");
            onDone();
          } else toast("err", d.error ?? "Failed");
        }}
      >
        Post review
      </Button>
    </Card>
  );
}
