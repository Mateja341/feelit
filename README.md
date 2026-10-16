# Feelit

Ultra-luxurious 3D villa & experience rental platform.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Three.js (React Three Fiber + drei) · Supabase · Stripe

## Features

- **Brand** — dark slate `#0F172A` theme, gold/amber accents, glassmorphism (`globals.css` utilities: `.glass`, `.glass-strong`, `.gold-text`, `.aurora`, `.hairline`).
- **Dual-journey hero** — guest exploration vs. owner listing paths.
- **Interactive villa feed** — live search, sort (price/rating), Framer Motion 3D tilt + `layoutId` card expansion rendering a procedural Three.js villa preview (`estate` / `overwater` / `chalet` models).
- **Villa detail pages** — `/villas/[id]` with a large 3D preview, amenities, stats, related villas, and a booking card.
- **Booking flow** — dates + guests → Stripe Checkout for a 20% deposit → webhook writes a `bookings` row → `/villas/[id]/booked` confirmation.
- **Host onboarding** — `/host` property form → Stripe Checkout ($49 one-time listing fee) → webhook publishes the villa.
- **Curated experiences** — homepage section with concierge-arranged add-ons.
- **Auth + dashboard** — Supabase email sign-in/up at `/auth`, auth-aware navbar, `/dashboard` lists the member's listings and stays.
- **Graceful degradation** — no env vars required: the feed falls back to a curated seed collection, auth/dashboard/checkout show clear "not configured" states.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by the Stripe webhook)
   - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Run `supabase/schema.sql` in the Supabase SQL editor to create `villas` + `bookings` tables with RLS policies.
4. `npm run dev` → http://localhost:3000

## Stripe flows

- `POST /api/checkout` — $49 host listing fee; villa fields ride in `metadata` → webhook inserts into `villas`.
- `POST /api/booking` — computes nights × price × 20% deposit; booking details in `metadata` → webhook inserts into `bookings`.
- `POST /api/stripe/webhook` — signature-verified `checkout.session.completed` handler (branches on `metadata.type`).
- Point a Stripe webhook at `https://<host>/api/stripe/webhook` (locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).

## Structure

```
app/                     # /, /villas/[id](+/booked), /host(+success), /auth, /dashboard, /api/*
components/              # Navbar, UserMenu, Hero, VillaFeed, VillaCanvas (3 model variants),
                         # VillaDetail, BookingCard, HostOnboarding, AuthForm, Experiences, SessionIdChip
lib/                     # types, format, seed data + getVillas()/getVillaById(), stripe client
lib/supabase/            # browser / cookie-aware server / service-role clients
proxy.ts                 # Supabase auth session refresh (Next 16 convention)
supabase/schema.sql      # villas + bookings tables, RLS
```
