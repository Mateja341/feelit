-- Feelit: seed the six showcase villas.
-- Run AFTER schema.sql in the Supabase SQL editor.
-- Idempotent: re-running is a no-op (fixed ids + ON CONFLICT DO NOTHING).

insert into public.villas (
  id, name, location, description, price_per_night,
  bedrooms, bathrooms, guests, rating, amenities, model, image_url, status
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'Villa Lumière',
    'Saint-Tropez, French Riviera',
    'A clifftop estate with a cascading infinity pool, private beach funicular, and a cellar curated by a Meilleur Ouvrier sommelier. Seven suites look across the Bay of Pampelonne; evenings end on the travertine terrace under a canopy of maritime pines.',
    18500, 7, 8, 14, 4.98,
    array[
      'Infinity pool',
      'Private beach access',
      'Sommelier cellar',
      'Chef''s kitchen',
      'Spa & hammam',
      'Helipad'
    ],
    'estate', '/villas/seed-1.webp', 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Casa Obsidiana',
    'Cabo San Lucas, Mexico',
    'Carved into volcanic rock above the Sea of Cortez — a glass-bottomed spa, onsen at sunset, and a chef trained at Pujol. Whale-watching from the master terrace is a daily ritual between December and April.',
    12400, 6, 7, 12, 4.94,
    array[
      'Glass-bottom spa',
      'Sunset onsen',
      'Private chef',
      'Ocean terrace',
      'Yacht tender',
      'Cinema room'
    ],
    'estate', '/villas/seed-2.webp', 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'The Glass Atoll',
    'Baa Atoll, Maldives',
    'An overwater residence with a sub-level master suite surrounded by reef life, seaplane arrival, and a dedicated dive butler. Hanifaru Bay''s manta season begins on your doorstep.',
    22000, 5, 6, 10, 4.99,
    array[
      'Underwater suite',
      'Seaplane arrival',
      'Dive butler',
      'Reef access',
      'Overwater spa',
      'Sunset dhoni'
    ],
    'overwater', '/villas/seed-3.webp', 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Chalet Aurelia',
    'Courchevel 1850, French Alps',
    'Ski-in/ski-out chalet with a heated marble pool, private gondola, and a cigar library stocked with vintage Habanos. The dedicated ski valet warms your boots before first lifts.',
    16800, 8, 9, 16, 4.96,
    array[
      'Ski-in/ski-out',
      'Heated marble pool',
      'Private gondola',
      'Cigar library',
      'Ski valet',
      'Avalanche-view spa'
    ],
    'chalet', '/villas/seed-4.webp', 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'Palazzo Verde',
    'Lake Como, Italy',
    'An 18th-century palazzo restored with contemporary art, botanical terraces, and a Riva speedboat with private pilot. Seven generations of gardeners shaped the camellia terraces.',
    19500, 9, 10, 18, 4.97,
    array[
      'Riva speedboat',
      'Botanical terraces',
      'Art collection',
      'Lakefront dock',
      'Wine cave',
      'Ballroom'
    ],
    'estate', '/villas/seed-5.webp', 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'Amara Reserve',
    'Ubud Highlands, Bali',
    'A jungle sanctuary of cantilevered pavilions, sacred-spring bathing pools, and a gamelan-composed soundscape at dusk. Breakfast arrives by river raft at the dining pavilion.',
    9800, 5, 5, 10, 4.92,
    array[
      'Sacred spring pools',
      'River rafting',
      'Jungle pavilions',
      'Gamelan evenings',
      'Rice terrace walks',
      'Healer on call'
    ],
    'overwater', '/villas/seed-6.webp', 'published'
  )
on conflict (id) do nothing;
