import { type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/api";

/** GET → published properties mapped to the feed's Villa shape.
 *  ?check_in=&check_out= filters by availability. */
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return json({ villas: [] });
  const { data, error } = await supabase
    .from("properties")
    .select(
      "*, property_photos(url,is_cover,position)",
    )
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false });
  if (error) return json({ villas: [], error: error.message });

  const ci = req.nextUrl.searchParams.get("check_in");
  const co = req.nextUrl.searchParams.get("check_out");
  let blocked = new Set<string>();
  if (ci && co) {
    const { data: un } = await supabase
      .from("availability_blocks")
      .select("property_id,start_date,end_date")
      .lt("start_date", co)
      .gt("end_date", ci);
    for (const b of un ?? []) blocked.add(b.property_id);
    const { data: bk } = await supabase
      .from("bookings")
      .select("property_id")
      .in("status", ["PENDING", "CONFIRMED"])
      .lt("check_in", co)
      .gt("check_out", ci);
    for (const b of bk ?? []) blocked.add(b.property_id);
  }

  const villas = (data ?? [])
    .filter((p) => !blocked.has(p.id))
    .map((p) => {
      const photos = (p.property_photos ?? []) as {
        url: string;
        is_cover: boolean;
        position: number;
      }[];
      const cover =
        photos.find((ph) => ph.is_cover)?.url ??
        photos.sort((a, b) => a.position - b.position)[0]?.url ??
        null;
      return {
        id: p.id,
        name: p.title,
        location: [p.city, p.country].filter(Boolean).join(", "),
        description: p.description,
        price_per_night: Number(p.nightly_price),
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        guests: p.max_guests,
        rating: Number(p.rating),
        amenities: p.amenities ?? [],
        model: p.model,
        image_url: cover,
        accent: p.accent,
        distance_km: p.distance_km ? Number(p.distance_km) : null,
        created_at: p.created_at,
      };
    });
  return json({ villas });
}
