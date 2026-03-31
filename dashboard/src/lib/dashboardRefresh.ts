/** Fired after successful import or when forcing dashboard widgets to refetch. */
export const DASHBOARD_REFRESH_EVENT = "profitpilot-dashboard-refresh";

const PENDING_KEY = "profitpilot_pending_dashboard_refresh";

/** Persist so navigating back to `/` after import still bumps data version. */
export function markDashboardRefreshPending(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeDashboardRefreshPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(PENDING_KEY) === "1") {
      sessionStorage.removeItem(PENDING_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function dispatchDashboardRefresh(): void {
  if (typeof window === "undefined") return;
  markDashboardRefreshPending();
  window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT));
}
