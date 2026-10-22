import crypto from "crypto";

/**
 * AES-256-GCM field encryption for sensitive values (JMBG, ID numbers,
 * IBAN, tax IDs). Key comes from FIELD_ENCRYPTION_KEY (32-byte hex or
 * any string → sha256'd). Ciphertext format: enc:v1:<iv>:<tag>:<data>
 * (base64). Server-side only — never import in client components.
 */

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY is not configured. Add it to .env.local.",
    );
  }
  return /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : crypto.createHash("sha256").update(raw).digest();
}

export function encryptField(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    [iv, tag, data].map((b) => b.toString("base64")).join(":")
  );
}

export function decryptField(enc: string): string {
  if (!enc.startsWith(PREFIX)) throw new Error("not an encrypted field");
  const [iv, tag, data] = enc
    .slice(PREFIX.length)
    .split(":")
    .map((s) => Buffer.from(s, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function isEncrypted(v: string | null | undefined): boolean {
  return typeof v === "string" && v.startsWith(PREFIX);
}

/** •••••••1234 — last 4 visible, rest masked. */
export function maskField(plain: string): string {
  if (plain.length <= 4) return "••••";
  return "•".repeat(Math.min(plain.length - 4, 9)) + plain.slice(-4);
}
