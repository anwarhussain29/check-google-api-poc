export const SESSION_COOKIE = "solar_leads_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_VERSION = "v1";

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function getTeamPassword(): string {
  const password = process.env.SOLAR_LEADS_PASSWORD;
  if (!password) {
    throw new Error("SOLAR_LEADS_PASSWORD is not set");
  }
  return password;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  const len = Math.max(aBuf.length, bBuf.length);
  let mismatch = aBuf.length === bBuf.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    mismatch |= (aBuf[i] ?? 0) ^ (bBuf[i] ?? 0);
  }
  return mismatch === 0;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

export function verifyPassword(input: string): boolean {
  return timingSafeEqualString(input, getTeamPassword());
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const expiresAt = String(now + SESSION_TTL_MS);
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  const signature = await hmacSign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  now = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresAt, signature] = parts;
  if (version !== SESSION_VERSION || !expiresAt || !signature) return false;

  const expiry = Number.parseInt(expiresAt, 10);
  if (!Number.isFinite(expiry) || expiry < now) return false;

  const payload = `${version}.${expiresAt}`;
  let expected: string;
  try {
    expected = await hmacSign(payload);
  } catch {
    return false;
  }
  return timingSafeEqualString(signature, expected);
}

export function sessionCookieOptions(maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000)) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Safe redirect target after login — only same-app solar-leads paths. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/tools/solar-leads")) return "/tools/solar-leads";
  if (next.startsWith("//") || next.includes("://")) return "/tools/solar-leads";
  if (next.startsWith("/tools/solar-leads/login")) return "/tools/solar-leads";
  return next;
}
