# Feelit

Ultra-luxury villa & experience rentals — Next.js App Router + TypeScript + Tailwind, Supabase (auth, Postgres, storage), Stripe (cards + bookings).

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:3000
```

Required env vars (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project API
- `SUPABASE_SERVICE_ROLE_KEY` — server-side writes (uploads, GDPR export, deletes)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` — Stripe test keys
- `FIELD_ENCRYPTION_KEY` — 32-byte hex (`openssl rand -hex 32`) for AES-256-GCM of sensitive fields
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally

## Database

Apply `supabase/schema.sql` then `supabase/seed.sql` in the Supabase SQL Editor (Dashboard → SQL → New query → paste → Run). Seed creates:

- `guest@feelit.demo` / `host@feelit.demo` — password `Feelit-Demo-1`
- 5 published villas with cover photos

## What's inside

- **Two roles**: GUEST + HOST (one account can be both).
- **Sign-up → role choice** → multi-step autosaved onboarding wizard (`/onboarding/guest`, `/onboarding/host`). Drafts persist in the DB — close the tab and resume.
- **Guest profile** (`/profile`): overview, personal data inline-edit, identity documents (masked, password-gated reveal), payment methods via Stripe, bookings (cancel/modify), favorites, photo uploads, villa media, messages, reviews, GDPR export + account delete.
- **Host dashboard** (`/host`): stats, listing wizard (draft → review → publish, pause/delete), per-property calendar (block dates + custom prices), reservations accept/decline, earnings + CSV export, 3D/drone/walk media management, messages, settings.
- **Booking**: real availability calendar, price rules, transactional `book_property` RPC (row lock → no double booking), cancellation-policy refunds.
- **Security**: AES-256-GCM encryption at rest for JMBG/ID/IBAN/tax IDs, masked display + reveal endpoint, private storage bucket with signed URLs, RLS on every table, audit log.
- **Media**: per-property GLB 3D model, drone video and walk-through with NOT_GENERATED / PROCESSING / READY statuses and auto-refresh.
- The search feed (`/search`) keeps the expanding 3D-card animation; published host listings appear there automatically.

## Conventions

- Dark-only theme: `ink` backgrounds, `gold` (violet) accent — see `app/globals.css` `@theme` tokens.
- Shared UI kit in `components/ui.tsx` (Button, Field, Card, Modal, Tabs, Stepper, Toast, Badge, Skeleton…).
- All data access goes through `app/api/*` route handlers using `lib/api.ts` helpers (auth, rate limit, audit).
