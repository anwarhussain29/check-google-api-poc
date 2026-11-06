import { cookies } from "next/headers";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth-session";

export {
  SESSION_COOKIE,
  createSessionToken,
  safeNextPath,
  sessionCookieOptions,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth-session";

export async function createSessionCookie(): Promise<void> {
  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Returns false when unauthenticated (does not throw). */
export async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}
