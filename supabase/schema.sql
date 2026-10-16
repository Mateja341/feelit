-- Feelit: villas + bookings tables with row level security
-- Run in Supabase SQL editor or via `supabase db push`.

create table if not exists public.villas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  location text not null,
  description text default '',
  price_per_night numeric(12, 2) not null check (price_per_night > 0),
  bedrooms integer not null default 1,
  bathrooms integer not null default 1,
  guests integer not null default 1,
  rating numeric(3, 2) not null default 5.0,
  amenities text[] not null default '{}',
  model text not null default 'estate' check (model in ('estate', 'overwater', 'chalet')),
  image_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  owner_id uuid references auth.users (id) on delete set null,
  owner_email text,
  stripe_session_id text unique
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  villa_id text not null,
  villa_name text not null,
  check_in date,
  check_out date,
  guests integer not null default 1,
  nights integer not null default 0,
  deposit_cents integer not null default 0,
  guest_id uuid references auth.users (id) on delete set null,
  guest_email text,
  stripe_session_id text unique,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed'))
);

alter table public.villas enable row level security;
alter table public.bookings enable row level security;

-- Anyone can browse published villas.
create policy "Published villas are publicly readable"
  on public.villas for select
  using (status = 'published');

-- Owners can read all of their own rows.
create policy "Owners can read their own villas"
  on public.villas for select
  using (auth.uid() = owner_id);

-- Owners manage their own listings (paid inserts come from the
-- service-role webhook, which bypasses RLS).
create policy "Owners can insert their own villas"
  on public.villas for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own villas"
  on public.villas for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their own villas"
  on public.villas for delete
  using (auth.uid() = owner_id);

-- Guests can read their own bookings.
create policy "Guests can read their own bookings"
  on public.bookings for select
  using (auth.uid() = guest_id or guest_email = (select email from auth.users where id = auth.uid()));

-- Owners can read bookings on their villas.
create policy "Owners can read bookings on their villas"
  on public.bookings for select
  using (
    exists (
      select 1 from public.villas v
      where v.id::text = bookings.villa_id and v.owner_id = auth.uid()
    )
  );
