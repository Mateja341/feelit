import type { Experience, Villa, VillaModel } from "./types";
import { createServerSupabaseClient } from "./supabase/server";

export const VILLA_ACCENTS = [
  "#d4af37",
  "#f59e0b",
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#fb7185",
] as const;

const VALID_MODELS: VillaModel[] = ["estate", "overwater", "chalet"];

/** Curated seed collection shown when Supabase is not configured or has no rows. */
export const SEED_VILLAS: Villa[] = [
  {
    id: "seed-1",
    name: "Villa Lumière",
    location: "Saint-Tropez, French Riviera",
    description:
      "A clifftop estate with a cascading infinity pool, private beach funicular, and a cellar curated by a Meilleur Ouvrier sommelier. Seven suites look across the Bay of Pampelonne; evenings end on the travertine terrace under a canopy of maritime pines.",
    price_per_night: 18500,
    bedrooms: 7,
    bathrooms: 8,
    guests: 14,
    rating: 4.98,
    amenities: [
      "Infinity pool",
      "Private beach",
      "Sommelier cellar",
      "Chef's kitchen",
      "Spa & hammam",
      "Helipad",
    ],
    model: "estate",
    image_url: null,
    accent: "#d4af37",
  },
  {
    id: "seed-2",
    name: "Casa Obsidiana",
    location: "Cabo San Lucas, Mexico",
    description:
      "Carved into volcanic rock above the Sea of Cortez — a glass-bottomed spa, onsen at sunset, and a chef trained at Pujol. Whale-watching from the master terrace is a daily ritual between December and April.",
    price_per_night: 12400,
    bedrooms: 6,
    bathrooms: 7,
    guests: 12,
    rating: 4.94,
    amenities: [
      "Glass-bottom spa",
      "Sunset onsen",
      "Private chef",
      "Ocean terrace",
      "Yacht tender",
      "Cinema room",
    ],
    model: "estate",
    image_url: null,
    accent: "#f59e0b",
  },
  {
    id: "seed-3",
    name: "The Glass Atoll",
    location: "Baa Atoll, Maldives",
    description:
      "An overwater residence with a sub-level master suite surrounded by reef life, seaplane arrival, and a dedicated dive butler. Hanifaru Bay's manta season begins on your doorstep.",
    price_per_night: 22000,
    bedrooms: 5,
    bathrooms: 6,
    guests: 10,
    rating: 4.99,
    amenities: [
      "Underwater suite",
      "Seaplane arrival",
      "Dive butler",
      "Reef access",
      "Overwater spa",
      "Sunset dhoni",
    ],
    model: "overwater",
    image_url: null,
    accent: "#38bdf8",
  },
  {
    id: "seed-4",
    name: "Chalet Aurelia",
    location: "Courchevel 1850, French Alps",
    description:
      "Ski-in/ski-out chalet with a heated marble pool, private gondola, and a cigar library stocked with vintage Habanos. The dedicated ski valet warms your boots before first lifts.",
    price_per_night: 16800,
    bedrooms: 8,
    bathrooms: 9,
    guests: 16,
    rating: 4.96,
    amenities: [
      "Ski-in/ski-out",
      "Heated marble pool",
      "Private gondola",
      "Cigar library",
      "Ski valet",
      "Avalanche-view spa",
    ],
    model: "chalet",
    image_url: null,
    accent: "#a78bfa",
  },
  {
    id: "seed-5",
    name: "Palazzo Verde",
    location: "Lake Como, Italy",
    description:
      "An 18th-century palazzo restored with contemporary art, botanical terraces, and a Riva speedboat with private pilot. Seven generations of gardeners shaped the camellia terraces.",
    price_per_night: 19500,
    bedrooms: 9,
    bathrooms: 10,
    guests: 18,
    rating: 4.97,
    amenities: [
      "Riva speedboat",
      "Botanical terraces",
      "Art collection",
      "Lakefront dock",
      "Wine cave",
      "Ballroom",
    ],
    model: "estate",
    image_url: null,
    accent: "#34d399",
  },
  {
    id: "seed-6",
    name: "Amara Reserve",
    location: "Ubud Highlands, Bali",
    description:
      "A jungle sanctuary of cantilevered pavilions, sacred-spring bathing pools, and a gamelan-composed soundscape at dusk. Breakfast arrives by river raft at the dining pavilion.",
    price_per_night: 9800,
    bedrooms: 5,
    bathrooms: 5,
    guests: 10,
    rating: 4.92,
    amenities: [
      "Sacred spring pools",
      "River rafting",
      "Jungle pavilions",
      "Gamelan evenings",
      "Rice terrace walks",
      "Healer on call",
    ],
    model: "overwater",
    image_url: null,
    accent: "#fb7185",
  },
];

export const EXPERIENCES: Experience[] = [
  {
    id: "exp-1",
    title: "Chef's Table at Your Villa",
    location: "Any Feelit villa",
    duration: "One evening",
    price: 2400,
    blurb:
      "A two-Michelin-star chef composes a nine-course tasting in your residence, paired by our resident sommelier.",
    accent: "#d4af37",
  },
  {
    id: "exp-2",
    title: "Sunset Yacht Charter",
    location: "Mediterranean & Caribbean",
    duration: "Full day",
    price: 6800,
    blurb:
      "A crewed 30m sailing yacht, chef-prepared lunch at anchor, and swim stops in water too blue to photograph honestly.",
    accent: "#38bdf8",
  },
  {
    id: "exp-3",
    title: "Heli-Gourmet Alpine Day",
    location: "French & Swiss Alps",
    duration: "8 hours",
    price: 9400,
    blurb:
      "Helicopter lifts to a private glacier picnic, a mountain-guide ski descent, and lunch at a refuge closed to the public.",
    accent: "#a78bfa",
  },
  {
    id: "exp-4",
    title: "Vineyard Immersion",
    location: "Bordeaux & Tuscany",
    duration: "Two days",
    price: 5200,
    blurb:
      "Harvest alongside the winemaker, blend your own cuvée to take home, and dine in the château's candlelit cellars.",
    accent: "#34d399",
  },
];

function mapRow(row: Record<string, unknown>, i: number): Villa {
  const rawModel = String(row.model ?? "estate");
  return {
    id: String(row.id),
    name: String(row.name),
    location: String(row.location),
    description: String(row.description ?? ""),
    price_per_night: Number(row.price_per_night),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms ?? row.bedrooms),
    guests: Number(row.guests),
    rating: Number(row.rating ?? 5.0),
    amenities: Array.isArray(row.amenities)
      ? (row.amenities as string[])
      : [],
    model: VALID_MODELS.includes(rawModel as VillaModel)
      ? (rawModel as VillaModel)
      : "estate",
    image_url: (row.image_url as string | null) ?? null,
    accent: VILLA_ACCENTS[i % VILLA_ACCENTS.length],
    created_at: row.created_at as string | undefined,
  };
}

/**
 * Reads villas from Supabase when configured; otherwise returns the seed
 * collection so the feed always renders.
 */
export async function getVillas(): Promise<Villa[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return SEED_VILLAS;

  const { data, error } = await supabase
    .from("villas")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return SEED_VILLAS;
  return data.map((row, i) => mapRow(row, i));
}

/**
 * Single villa lookup: Supabase first, seed collection as fallback.
 */
export async function getVillaById(id: string): Promise<Villa | null> {
  const supabase = createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("villas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return mapRow(data, 0);
  }
  return SEED_VILLAS.find((v) => v.id === id) ?? null;
}
