import { z } from "zod";

/**
 * JMBG (Serbian unique citizen ID): 13 digits, digits 0-6 encode DDMMYYY
 * of birth, digit 12 is a control digit:
 *   k = 11 − ((7(a1+a7)+6(a2+a8)+5(a3+a9)+4(a4+a10)+3(a5+a11)+2(a6+a12)) mod 11)
 *   k = 0 when result is 10 or 11
 */
export function validateJMBG(jmbg: string): boolean {
  if (!/^\d{13}$/.test(jmbg)) return false;
  const d = jmbg.split("").map(Number);
  const day = d[0] * 10 + d[1];
  const month = d[2] * 10 + d[3];
  const year3 = d[4] * 100 + d[5] * 10 + d[6];
  // year: 0xx→2000s, 9xx→1900s (JMBG convention)
  const year = year3 > 900 ? 1000 + year3 : 2000 + year3;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  const s =
    7 * (d[0] + d[6]) +
    6 * (d[1] + d[7]) +
    5 * (d[2] + d[8]) +
    4 * (d[3] + d[9]) +
    3 * (d[4] + d[10]) +
    2 * (d[5] + d[11]);
  let k = 11 - (s % 11);
  if (k === 10 || k === 11) k = 0;
  return k === d[12];
}

export const emailSchema = z.string().trim().toLowerCase().email();

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters");

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw) && pw.length >= 12) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Use international format, e.g. +381641234567");

export const personalStepSchema = z.object({
  first_name: z.string().trim().min(1, "Required"),
  last_name: z.string().trim().min(1, "Required"),
  parent_name: z.string().trim().optional().or(z.literal("")),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((v) => {
      const dob = new Date(v + "T00:00:00Z");
      const now = new Date();
      const age =
        (now.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 18 && age < 120;
    }, "You must be 18 or older"),
  gender: z.string().optional().or(z.literal("")),
  nationality: z.string().trim().min(1, "Required"),
  country_of_residence: z.string().trim().min(1, "Required"),
  preferred_language: z.string().default("en"),
  preferred_currency: z.string().default("USD"),
  occupation: z.string().optional().or(z.literal("")),
});

export const identityStepSchema = z
  .object({
    doc_type: z.enum(["national_id", "passport", "drivers_license", "jmbg"]),
    doc_number: z.string().trim().min(3, "Required"),
    issue_date: z.string().optional().or(z.literal("")),
    expiry_date: z.string().optional().or(z.literal("")),
    issuing_country: z.string().trim().min(1, "Required"),
    nationality: z.string().optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if (v.doc_type === "jmbg" && !validateJMBG(v.doc_number)) {
      ctx.addIssue({
        code: "custom",
        path: ["doc_number"],
        message: "Invalid JMBG (check digits)",
      });
    }
  });

export const addressSchema = z.object({
  line1: z.string().trim().min(1, "Required"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().trim().min(1, "Required"),
  postal_code: z.string().optional().or(z.literal("")),
  country: z.string().trim().min(1, "Required"),
});

export const propertySchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().optional().or(z.literal("")),
  property_type: z.string().default("villa"),
  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  distance_km: z.number().nullable().optional(),
  nightly_price: z.number().min(1),
  cleaning_fee: z.number().min(0).default(0),
  deposit: z.number().min(0).default(0),
  min_nights: z.number().int().min(1).default(1),
  max_nights: z.number().int().min(1).default(60),
  max_guests: z.number().int().min(1).default(2),
  bedrooms: z.number().int().min(0).default(1),
  beds: z.number().int().min(0).default(1),
  bathrooms: z.number().int().min(0).default(1),
  amenities: z.array(z.string()).default([]),
  house_rules: z.string().optional().or(z.literal("")),
  check_in_from: z.string().default("15:00"),
  check_out_until: z.string().default("11:00"),
  cancellation_policy: z
    .enum(["flexible", "moderate", "strict"])
    .default("moderate"),
  instant_book: z.boolean().default(true),
});

export const bookingSchema = z.object({
  property_id: z.string().uuid(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1),
  rooms: z.number().int().min(1).default(1),
  payment_method_id: z.string().uuid().optional(),
});
