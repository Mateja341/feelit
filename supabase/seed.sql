-- ============================================================
-- Feelit — demo seed. Run AFTER schema.sql.
-- Creates a demo host (auth user) + 5 published villas.
-- Demo login: host@feelit.demo / Feelit-Demo-1
-- Demo guest: guest@feelit.demo / Feelit-Demo-1
-- Passwords are set via Supabase's auth admin — if the insert
-- below fails on your project, create the two users in
-- Authentication → Users with those emails/passwords instead.
-- ============================================================

-- create demo auth users (works in SQL editor: auth schema is writable)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, crypt('Feelit-Demo-1', gen_salt('bf')), now(), now(), now(), ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'host@feelit.demo'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'guest@feelit.demo')
) as u(id, email)
where not exists (select 1 from auth.users a where a.email = u.email);

insert into public.profiles (id, email, roles, first_name, last_name, guest_onboarded, host_onboarded)
values
  ('11111111-1111-1111-1111-111111111111', 'host@feelit.demo', '{GUEST,HOST}', 'Demo', 'Host', true, true),
  ('22222222-2222-2222-2222-222222222222', 'guest@feelit.demo', '{GUEST}', 'Demo', 'Guest', true, false)
on conflict (id) do nothing;

insert into public.host_profiles (
  user_id, host_type, display_name, bio, languages, verification_status
) values (
  '11111111-1111-1111-1111-111111111111', 'individual', 'Demo Host',
  'Feelit demo host.', '{English}', 'VERIFIED'
) on conflict (user_id) do nothing;

insert into public.properties (
  host_id, title, description, property_type, country, city, distance_km,
  nightly_price, cleaning_fee, deposit, min_nights, max_guests,
  bedrooms, beds, bathrooms, amenities, status, model, accent, rating
) values
('11111111-1111-1111-1111-111111111111', 'Villa Lumière',
 'A clifftop estate with a cascading infinity pool, private beach funicular, and a cellar curated by a Meilleur Ouvrier sommelier.',
 'villa', 'France', 'Saint-Tropez', 0.7, 18500, 450, 2000, 2, 14, 7, 10, 8,
 '{Infinity pool,Private beach,Sommelier cellar,Chef''s kitchen,Spa & hammam,Helipad}',
 'PUBLISHED', 'estate', '#a855f7', 4.98),
('11111111-1111-1111-1111-111111111111', 'Casa Obsidiana',
 'Carved into volcanic rock above the Sea of Cortez — a glass-bottomed spa, onsen at sunset, and a chef trained at Pujol.',
 'villa', 'Mexico', 'Cabo San Lucas', 0.8, 12400, 400, 1500, 2, 12, 6, 8, 7,
 '{Glass-bottom spa,Sunset onsen,Private chef,Ocean terrace,Yacht tender,Cinema room}',
 'PUBLISHED', 'estate', '#c084fc', 4.94),
('11111111-1111-1111-1111-111111111111', 'The Glass Atoll',
 'An overwater residence with a sub-level master suite surrounded by reef life, seaplane arrival, and a dedicated dive butler.',
 'villa', 'Maldives', 'Baa Atoll', 0.9, 22000, 500, 3000, 3, 10, 5, 7, 6,
 '{Underwater suite,Seaplane arrival,Dive butler,Reef access,Overwater spa,Sunset dhoni}',
 'PUBLISHED', 'overwater', '#8b5cf6', 4.99),
('11111111-1111-1111-1111-111111111111', 'Chalet Aurelia',
 'Ski-in/ski-out chalet with a heated marble pool, private gondola, and a cigar library stocked with vintage Habanos.',
 'villa', 'France', 'Courchevel 1850', 1.0, 16800, 450, 2000, 2, 16, 8, 12, 9,
 '{Ski-in/ski-out,Heated marble pool,Private gondola,Cigar library,Ski valet,Avalanche-view spa}',
 'PUBLISHED', 'chalet', '#6e3aff', 4.96),
('11111111-1111-1111-1111-111111111111', 'Palazzo Verde',
 'An 18th-century palazzo restored with contemporary art, botanical terraces, and a Riva speedboat with private pilot.',
 'villa', 'Italy', 'Lake Como', 1.1, 19500, 500, 2500, 3, 18, 9, 12, 10,
 '{Riva speedboat,Botanical terraces,Art collection,Lakefront dock,Wine cave,Ballroom}',
 'PUBLISHED', 'estate', '#7c3aed', 4.97)
on conflict do nothing;

insert into public.property_photos (property_id, url, position, is_cover)
select p.id, '/villas/seed-' || (row_number() over ()) || '.webp', 0, true
from public.properties p
where p.host_id = '11111111-1111-1111-1111-111111111111'
  and not exists (select 1 from public.property_photos pp where pp.property_id = p.id);

insert into public.property_media (property_id, kind, status)
select p.id, k.kind, 'NOT_GENERATED'
from public.properties p
cross join (values ('MODEL_3D'),('DRONE_VIDEO'),('WALK_VIDEO')) as k(kind)
on conflict (property_id, kind) do nothing;
