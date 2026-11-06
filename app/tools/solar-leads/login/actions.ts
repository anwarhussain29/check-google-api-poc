"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createSessionCookie,
  safeNextPath,
  verifyPassword,
} from "@/lib/auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const password = formData.get("password")?.toString() ?? "";
  const next = formData.get("next")?.toString() ?? null;

  if (!password) {
    return { ok: false, error: "Password is required" };
  }

  try {
    if (!verifyPassword(password)) {
      return { ok: false, error: "Incorrect password" };
    }
    await createSessionCookie();
  } catch {
    return { ok: false, error: "Authentication is not configured" };
  }

  redirect(safeNextPath(next));
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/tools/solar-leads/login");
}
