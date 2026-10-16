export type VillaModel = "estate" | "overwater" | "chalet";

export type Villa = {
  id: string;
  name: string;
  location: string;
  description: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  rating: number;
  amenities: string[];
  model: VillaModel;
  image_url: string | null;
  accent: string;
  created_at?: string;
};

export type VillaInput = Omit<Villa, "id" | "accent" | "created_at">;

export type Experience = {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: number;
  blurb: string;
  accent: string;
};

export type Booking = {
  id: string;
  villa_id: string;
  villa_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  deposit_cents: number;
  guest_email: string | null;
  status: string;
  created_at?: string;
};

export const BOOKING_DEPOSIT_RATE = 0.2;
