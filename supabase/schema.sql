-- ============================================================
-- Feelit — complete schema (guests + hosts + bookings + media)
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================

-- ---------- profiles & roles ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  roles text[] not null default '{GUEST}' check (roles <@ '{GUEST,HOST,ADMIN}'::text[]),
  -- guest personal data
  first_name text,
  last_name text,
  parent_name text,
  date_of_birth date,
  gender text,
  nationality text,
  country_of_residence text,
  preferred_language text default 'en',
  preferred_currency text default 'USD',
  occupation text,
  phone text,
  phone_verified boolean not null default false,
  travel_purpose text,
  arrival_method text,
  special_requests text,
  allergies_diet text,
  pets boolean,
  -- onboarding drafts + state (autosave / resume)
  guest_draft jsonb not null default '{}',
  host_draft jsonb not null default '{}',
  guest_step integer not null default 0,
  host_step integer not null default 0,
  guest_onboarded boolean not null default false,
  host_onboarded boolean not null default false,
  -- notifications prefs
  notify_email boolean not null default true,
  notify_inapp boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.host_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  host_type text not null default 'individual' check (host_type in ('individual','company')),
  -- individual
  id_number_enc text,          -- AES-256-GCM encrypted JMBG / ID / passport no.
  date_of_birth date,
  address text,
  -- company
  legal_name text,
  registration_number text,
  tax_id_enc text,             -- encrypted PIB / VAT
  vat_number text,
  legal_address text,
  rep_full_name text,
  rep_id_number_enc text,
  -- public profile
  display_name text,
  photo_url text,
  bio text,
  languages text[] not null default '{}',
  response_time text,
  years_hosting integer,
  -- verification
  verification_status text not null default 'NOT_VERIFIED'
    check (verification_status in ('NOT_VERIFIED','PENDING','VERIFIED','REJECTED')),
  verification_reason text,
  tax_residency text,
  tax_form_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.identity_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  doc_type text not null check (doc_type in ('national_id','passport','drivers_license','jmbg')),
  number_enc text,             -- AES-256-GCM encrypted document number
  number_masked text,          -- e.g. •••••••1234 — safe to show
  issue_date date,
  expiry_date date,
  issuing_country text,
  front_path text,             -- private bucket object path
  back_path text,
  selfie_path text,
  status text not null default 'PENDING'
    check (status in ('NOT_VERIFIED','PENDING','VERIFIED','REJECTED')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'residential' check (kind in ('residential','billing')),
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text,
  country text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text,
  relationship text,
  created_at timestamptz not null default now()
);

create table if not exists public.additional_guests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  id_number_enc text,
  id_number_masked text,
  relationship text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_pm_id text not null unique,
  cardholder_name text,
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  billing_zip text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'bank' check (kind in ('bank','stripe_connect')),
  account_holder text,
  iban_enc text,
  iban_masked text,
  swift text,
  bank_name text,
  currency text default 'USD',
  stripe_account_id text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  version text not null default '1.0',
  accepted boolean not null default true,
  ip inet,
  created_at timestamptz not null default now()
);

-- ---------- properties ----------

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  property_type text not null default 'villa',
  country text,
  city text,
  address text,
  lat double precision,
  lng double precision,
  distance_km numeric(6,2),
  nightly_price numeric(12,2) not null default 0,
  cleaning_fee numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  min_nights integer not null default 1,
  max_nights integer not null default 60,
  max_guests integer not null default 2,
  bedrooms integer not null default 1,
  beds integer not null default 1,
  bathrooms integer not null default 1,
  amenities text[] not null default '{}',
  house_rules text not null default '',
  check_in_from text default '15:00',
  check_out_until text default '11:00',
  cancellation_policy text not null default 'moderate'
    check (cancellation_policy in ('flexible','moderate','strict')),
  instant_book boolean not null default true,
  status text not null default 'DRAFT'
    check (status in ('DRAFT','PENDING_REVIEW','PUBLISHED','PAUSED')),
  rating numeric(3,2) not null default 5.0,
  model text not null default 'estate' check (model in ('estate','overwater','chalet')),
  accent text not null default '#a855f7',
  draft_step integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  path text not null,          -- private bucket path
  kind text not null default 'ownership',
  status text not null default 'PENDING'
    check (status in ('NOT_VERIFIED','PENDING','VERIFIED','REJECTED')),
  created_at timestamptz not null default now()
);

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  kind text not null check (kind in ('MODEL_3D','DRONE_VIDEO','WALK_VIDEO')),
  url text,
  status text not null default 'NOT_GENERATED'
    check (status in ('NOT_GENERATED','PROCESSING','READY')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, kind)
);

create table if not exists public.user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  caption text,
  property_id uuid references public.properties (id) on delete set null,
  booking_id uuid,
  created_at timestamptz not null default now()
);

-- ---------- favorites ----------

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- ---------- bookings ----------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  check_in date not null,
  check_out date not null,
  nights integer not null,
  guests_count integer not null default 1,
  rooms_count integer not null default 1,
  price_per_night numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  cleaning_fee numeric(12,2) not null default 0,
  taxes numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  deposit numeric(12,2) not null default 0,
  currency text not null default 'USD',
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  stripe_payment_intent text,
  status text not null default 'PENDING'
    check (status in ('PENDING','CONFIRMED','CANCELLED','COMPLETED','DECLINED')),
  cancel_reason text,
  decline_reason text,
  refund_amount numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default 'HOST_BLOCKED' check (reason in ('BOOKED','HOST_BLOCKED')),
  booking_id uuid references public.bookings (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create index if not exists availability_blocks_prop_dates
  on public.availability_blocks (property_id, start_date, end_date);
create index if not exists bookings_prop_dates
  on public.bookings (property_id, check_in, check_out);
create index if not exists bookings_guest on public.bookings (guest_id, status);
create index if not exists properties_host on public.properties (host_id, status);
create index if not exists properties_status on public.properties (status);

create table if not exists public.price_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  price numeric(12,2) not null,
  label text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  target text not null check (target in ('guest','host')),
  rating integer not null check (rating between 1 and 5),
  text text not null default '',
  reply text,
  created_at timestamptz not null default now(),
  unique (booking_id, target)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.profiles (id) on delete cascade,
  host_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (guest_id, host_id, property_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  meta jsonb not null default '{}',
  ip inet,
  created_at timestamptz not null default now()
);

-- keep legacy tables (older seed) — new code uses `properties`
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

-- ---------- helper functions ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce('ADMIN' = any(select roles from public.profiles where id = auth.uid()), false);
$$;

-- overlapping unavailable dates for a property in [p_from, p_to)
create or replace function public.property_unavailable(
  p_property_id uuid, p_from date, p_to date
) returns setof date language sql stable security definer set search_path = public as $$
  select d::date from generate_series(p_from, p_to - 1, '1 day') d
  where exists (
    select 1 from public.availability_blocks b
    where b.property_id = p_property_id
      and d.d >= b.start_date and d.d < b.end_date
  ) or exists (
    select 1 from public.bookings bk
    where bk.property_id = p_property_id
      and bk.status in ('PENDING','CONFIRMED')
      and d.d >= bk.check_in and d.d < bk.check_out
  );
$$;

-- atomic booking creation: locks the property row, re-checks availability,
-- computes price, inserts booking + BOOKED availability block.
create or replace function public.book_property(
  p_property_id uuid,
  p_guest_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests int,
  p_rooms int default 1,
  p_payment_method uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_prop public.properties%rowtype;
  v_nights int;
  v_sub numeric(12,2);
  v_taxes numeric(12,2);
  v_total numeric(12,2);
  v_id uuid;
  d date;
  v_price numeric(12,2);
begin
  -- lock the property row so two guests can't double-book concurrently
  select * into v_prop from public.properties where id = p_property_id for update;
  if not found then raise exception 'property not found'; end if;
  if v_prop.status <> 'PUBLISHED' then raise exception 'property is not bookable'; end if;
  if p_check_in < current_date then raise exception 'check-in is in the past'; end if;
  v_nights := p_check_out - p_check_in;
  if v_nights < v_prop.min_nights then
    raise exception 'minimum stay is % nights', v_prop.min_nights;
  end if;
  if v_nights > v_prop.max_nights then
    raise exception 'maximum stay is % nights', v_prop.max_nights;
  end if;
  if p_guests > v_prop.max_guests then
    raise exception 'property sleeps % guests', v_prop.max_guests;
  end if;
  -- hard availability re-check inside the transaction
  perform 1 from public.property_unavailable(p_property_id, p_check_in, p_check_out) limit 1;
  if found then raise exception 'selected dates are not available'; end if;

  -- price: custom rule wins, else nightly price
  v_sub := 0;
  for d in select generate_series(p_check_in, p_check_out - 1, '1 day') loop
    select coalesce((
      select r.price from public.price_rules r
      where r.property_id = p_property_id and d.d >= r.start_date and d.d < r.end_date
      order by r.start_date desc limit 1
    ), v_prop.nightly_price) into v_price;
    v_sub := v_sub + v_price;
  end loop;

  v_taxes := round(v_sub * 0.12, 2);
  v_total := v_sub + v_prop.cleaning_fee + v_taxes;

  insert into public.bookings (
    guest_id, property_id, check_in, check_out, nights, guests_count, rooms_count,
    price_per_night, subtotal, cleaning_fee, taxes, total, deposit,
    payment_method_id, status
  ) values (
    p_guest_id, p_property_id, p_check_in, p_check_out, v_nights, p_guests, p_rooms,
    v_prop.nightly_price, v_sub, v_prop.cleaning_fee, v_taxes, v_total, v_prop.deposit,
    p_payment_method,
    case when v_prop.instant_book then 'CONFIRMED' else 'PENDING' end
  ) returning id into v_id;

  insert into public.availability_blocks (property_id, start_date, end_date, reason, booking_id)
  values (p_property_id, p_check_in, p_check_out, 'BOOKED', v_id);

  insert into public.notifications (user_id, kind, title, body, link)
  values (p_guest_id, 'booking', 'Booking ' ||
    case when v_prop.instant_book then 'confirmed' else 'requested' end,
    v_prop.title || ' · ' || p_check_in || ' → ' || p_check_out, '/profile?tab=bookings');
  insert into public.notifications (user_id, kind, title, body, link)
  values (v_prop.host_id, 'booking', 'New booking ' ||
    case when v_prop.instant_book then 'confirmed' else 'request' end,
    v_prop.title || ' · ' || p_check_in || ' → ' || p_check_out, '/host?tab=reservations');

  return v_id;
end;
$$;

-- cancel a booking: frees the dates, computes refund by policy
create or replace function public.cancel_booking(p_booking uuid, p_by uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  v_b public.bookings%rowtype;
  v_refund numeric(12,2);
  v_policy text;
begin
  select * into v_b from public.bookings where id = p_booking for update;
  if not found then raise exception 'booking not found'; end if;
  if v_b.guest_id <> p_by and v_b.property_id not in
     (select id from public.properties where host_id = p_by)
     and not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if v_b.status in ('CANCELLED','DECLINED','COMPLETED') then
    raise exception 'booking is already %', lower(v_b.status);
  end if;
  select cancellation_policy into v_policy from public.properties where id = v_b.property_id;
  v_refund := case
    when current_date >= v_b.check_in then 0
    when v_policy = 'flexible' and v_b.check_in - current_date >= 1 then v_b.total
    when v_policy = 'moderate' and v_b.check_in - current_date >= 5 then v_b.total
    when v_policy = 'strict' and v_b.check_in - current_date >= 14 then v_b.total * 0.5
    else 0 end;

  update public.bookings set status = 'CANCELLED', refund_amount = v_refund,
    updated_at = now() where id = p_booking;
  delete from public.availability_blocks where booking_id = p_booking;
  return v_refund;
end;
$$;

-- ---------- row level security ----------

alter table public.profiles enable row level security;
alter table public.host_profiles enable row level security;
alter table public.identity_documents enable row level security;
alter table public.addresses enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.additional_guests enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payout_accounts enable row level security;
alter table public.consents enable row level security;
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.property_documents enable row level security;
alter table public.property_media enable row level security;
alter table public.user_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.bookings enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.price_rules enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payouts enable row level security;
alter table public.audit_log enable row level security;
alter table public.villas enable row level security;
alter table public.bookings force row level security;

-- profiles: own row only
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "own host profile" on public.host_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public host card" on public.host_profiles for select
  using (verification_status = 'VERIFIED');

create policy "own identity docs" on public.identity_documents for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

create policy "own addresses" on public.addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own emergency contacts" on public.emergency_contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own additional guests" on public.additional_guests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own payment methods" on public.payment_methods for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own payout accounts" on public.payout_accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own consents" on public.consents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- properties: public reads published only; host owns the rest
create policy "published properties are public" on public.properties
  for select using (status = 'PUBLISHED');
create policy "hosts read own properties" on public.properties
  for select using (auth.uid() = host_id or public.is_admin());
create policy "hosts insert own properties" on public.properties
  for insert with check (auth.uid() = host_id);
create policy "hosts update own properties" on public.properties
  for update using (auth.uid() = host_id or public.is_admin())
  with check (auth.uid() = host_id or public.is_admin());
create policy "hosts delete own properties" on public.properties
  for delete using (auth.uid() = host_id or public.is_admin());

create policy "photos of published props are public" on public.property_photos
  for select using (
    exists (select 1 from public.properties p
      where p.id = property_id and (p.status = 'PUBLISHED' or p.host_id = auth.uid())));
create policy "hosts manage own photos" on public.property_photos for all
  using (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()))
  with check (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));

create policy "hosts manage own property docs" on public.property_documents for all
  using (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()) or public.is_admin())
  with check (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));

create policy "media readable with property" on public.property_media
  for select using (
    exists (select 1 from public.properties p
      where p.id = property_id and (p.status = 'PUBLISHED' or p.host_id = auth.uid())));
create policy "hosts manage own media" on public.property_media for all
  using (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()))
  with check (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));

create policy "own photos" on public.user_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own favorites" on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bookings: guest owns theirs; host reads bookings on own properties
create policy "guests read own bookings" on public.bookings
  for select using (auth.uid() = guest_id);
create policy "hosts read bookings on own properties" on public.bookings
  for select using (
    exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));
create policy "guests create own bookings" on public.bookings
  for insert with check (auth.uid() = guest_id);
create policy "participants update bookings" on public.bookings
  for update using (
    auth.uid() = guest_id or
    exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));

create policy "availability readable" on public.availability_blocks
  for select using (true);
create policy "hosts manage own blocks" on public.availability_blocks for all
  using (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()))
  with check (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));

create policy "price rules readable" on public.price_rules
  for select using (true);
create policy "hosts manage own price rules" on public.price_rules for all
  using (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()))
  with check (exists (select 1 from public.properties p
      where p.id = property_id and p.host_id = auth.uid()));

create policy "reviews readable" on public.reviews
  for select using (true);
create policy "authors write reviews" on public.reviews for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "conversation participants" on public.conversations for all
  using (auth.uid() in (guest_id, host_id))
  with check (auth.uid() in (guest_id, host_id));

create policy "message participants" on public.messages for select
  using (exists (select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.guest_id, c.host_id)));
create policy "participants send messages" on public.messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.guest_id, c.host_id)));

create policy "own notifications" on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own payouts" on public.payouts for select
  using (auth.uid() = host_id or public.is_admin());

create policy "admins read audit log" on public.audit_log for select
  using (public.is_admin());

-- legacy villas policies
create policy "Published villas are publicly readable"
  on public.villas for select using (status = 'published');
create policy "Owners can read their own villas"
  on public.villas for select using (auth.uid() = owner_id);
create policy "Owners can insert their own villas"
  on public.villas for insert with check (auth.uid() = owner_id);
create policy "Owners can update their own villas"
  on public.villas for update using (auth.uid() = owner_id);
create policy "Owners can delete their own villas"
  on public.villas for delete using (auth.uid() = owner_id);

-- ---------- storage buckets ----------

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true),
       ('user-photos', 'user-photos', true),
       ('property-media', 'property-media', true),
       ('private-docs', 'private-docs', false)
on conflict (id) do nothing;

create policy "public read property photos" on storage.objects for select
  using (bucket_id in ('property-photos','user-photos','property-media'));
create policy "authenticated upload" on storage.objects for insert
  with check (bucket_id in ('property-photos','user-photos','property-media') and auth.role() = 'authenticated');
create policy "owners manage objects" on storage.objects for update
  using (auth.uid()::text = (storage.foldername(name))[1]);
create policy "owners delete objects" on storage.objects for delete
  using (auth.uid()::text = (storage.foldername(name))[1]);
create policy "owners read private docs" on storage.objects for select
  using (bucket_id = 'private-docs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "owners upload private docs" on storage.objects for insert
  with check (bucket_id = 'private-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- updated_at trigger ----------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','host_profiles','identity_documents','properties','property_media','bookings'] loop
    execute format('drop trigger if exists touch on public.%I;
      create trigger touch before update on public.%I
      for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
