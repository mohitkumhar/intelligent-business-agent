"use client";

import { api } from "./api";

/** Persist `user_email` from the URL into localStorage so API calls include `email`. */
export function syncUserEmailFromUrl(): void {
  if (typeof window === "undefined") return;
  const email = new URLSearchParams(window.location.search).get("user_email");
  if (!email) return;
  try {
    const raw = localStorage.getItem("profit_pilot_user");
    const u = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    if (u.email === email) return;
    localStorage.setItem(
      "profit_pilot_user",
      JSON.stringify({ ...u, email }),
    );
    window.dispatchEvent(new Event("profitpilot-user"));
  } catch {
    localStorage.setItem("profit_pilot_user", JSON.stringify({ email }));
    window.dispatchEvent(new Event("profitpilot-user"));
  }
}

/** Load business profile and store `full_name` / `email` for the top bar and profile page. */
export async function syncUserNameFromApi(): Promise<void> {
  if (typeof window === "undefined") return;
  syncUserEmailFromUrl();
  try {
    const b = await api.getBusinessInfo();
    if (!b?.user_name?.trim()) return;
    const raw = localStorage.getItem("profit_pilot_user") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    localStorage.setItem(
      "profit_pilot_user",
      JSON.stringify({
        ...u,
        full_name: b.user_name,
        email: b.user_email || u.email,
      }),
    );
    window.dispatchEvent(new Event("profitpilot-user"));
  } catch {
    /* offline or not onboarded */
  }
}
