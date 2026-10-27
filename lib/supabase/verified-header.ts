import type { User } from "@supabase/supabase-js";

export const VERIFIED_USER_HEADER = "x-nitin-verified-user";
export const VERIFIED_SIG_HEADER = "x-nitin-verified-sig";
export const VERIFIED_COOKIE_NAME = "nitin-admin-v1";

function getSigningMaterial(): string {
  return [
    process.env.POOL_DATABASE_URL ?? "",
    process.env.DATABASE_URL ?? "",
    process.env.ADMIN_EMAILS ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    "nitin-cms-internal-v1",
  ].join("|");
}

let cachedKeyPromise: Promise<CryptoKey> | null = null;

function getHmacKey(): Promise<CryptoKey> {
  if (!cachedKeyPromise) {
    const enc = new TextEncoder();
    cachedKeyPromise = globalThis.crypto.subtle.importKey(
      "raw",
      enc.encode(getSigningMaterial()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return cachedKeyPromise;
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function signVerifiedUser(
  user: Pick<User, "id" | "email">,
  tokenFingerprint = "",
): Promise<{
  payload: string;
  signature: string;
}> {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email ?? "",
    fp: tokenFingerprint,
    ts: Date.now(),
  });
  const key = await getHmacKey();
  const sigBuf = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return { payload, signature: toHex(sigBuf) };
}

export async function readVerifiedUser(
  payload: string | null,
  signature: string | null,
  maxAgeMs = 30_000,
  expectedFingerprint?: string,
): Promise<User | null> {
  if (!payload || !signature) return null;
  try {
    const key = await getHmacKey();
    const sigBytes = new Uint8Array(signature.length / 2);
    for (let i = 0; i < sigBytes.length; i++) {
      sigBytes[i] = parseInt(signature.slice(i * 2, i * 2 + 2), 16);
    }
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;
    const parsed = JSON.parse(payload) as {
      id?: string;
      email?: string;
      fp?: string;
      ts?: number;
    };
    if (!parsed.id || typeof parsed.ts !== "number") return null;
    if (Math.abs(Date.now() - parsed.ts) > maxAgeMs) return null;
    if (expectedFingerprint !== undefined && parsed.fp !== expectedFingerprint) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "",
    } as User;
  } catch {
    return null;
  }
}
