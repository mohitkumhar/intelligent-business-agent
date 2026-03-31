export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const ONBOARDED_EMAILS_KEY = "profit_pilot_onboarded_emails";
const LEGACY_ONBOARDED_KEY = "profit_pilot_onboarded";

function readEmailSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ONBOARDED_EMAILS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((e): e is string => typeof e === "string" && e.length > 0));
  } catch {
    return new Set();
  }
}

function writeEmailSet(set: Set<string>): void {
  localStorage.setItem(ONBOARDED_EMAILS_KEY, JSON.stringify([...set]));
}

/** One-time: migrate global onboarded flag to the email that completed onboarding. */
function migrateLegacyOnboardedFlag(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEGACY_ONBOARDED_KEY) !== "true") return;
  try {
    const userStr = localStorage.getItem("profit_pilot_user");
    if (userStr) {
      const user = JSON.parse(userStr) as { email?: string };
      if (user.email) {
        const set = readEmailSet();
        set.add(user.email);
        writeEmailSet(set);
      }
    }
  } finally {
    localStorage.removeItem(LEGACY_ONBOARDED_KEY);
  }
}

export function isUserOnboarded(email: string | null | undefined): boolean {
  if (!email) return false;
  migrateLegacyOnboardedFlag();
  return readEmailSet().has(normalizeEmail(email));
}

export function markUserOnboarded(email: string): void {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  migrateLegacyOnboardedFlag();
  const set = readEmailSet();
  set.add(normalized);
  writeEmailSet(set);
}
