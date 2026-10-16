import Stripe from "stripe";

let stripe: Stripe | null = null;

export const LISTING_FEE_CENTS = 4900; // $49 one-time host listing fee

/**
 * Lazily-initialized Stripe client. Throws a descriptive error when
 * STRIPE_SECRET_KEY is not configured.
 */
export function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env.local to enable checkout.",
    );
  }
  stripe = new Stripe(key);
  return stripe;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}
