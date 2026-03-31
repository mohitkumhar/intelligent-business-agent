import type { DashboardPeriod } from "./dashboardPeriod";
import {
  mockSummary,
  mockFinancialOverview,
  mockSalesTarget,
  mockTransactions,
  mockCategories,
  mockRevenueVsExpense,
  mockSalesTrend,
  mockAlertsBySeverity,
  mockHealthScores,
  mockTopProducts,
  mockEmployeeStats,
} from "./mockData";
import {
  filterTransactionsByPeriod,
  mockSummaryForPeriod,
  mockRevenueVsExpenseForPeriod,
  mockSalesTrendForPeriod,
  mockFinancialOverviewForPeriod,
  mockSalesTargetForPeriod,
  mockAlertsForPeriod,
} from "./mockPeriod";
import { getPeriodBounds, periodLabel } from "./dashboardPeriod";
import { AGENT_API_BASE } from "./publicUrls";

export interface DashboardSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_transactions: number;
  active_alerts: number;
  /** Highest severity among active alerts (for KPI badge). */
  alert_highest_severity?: string | null;
  /** vs same-length window before current period (null if no comparison). */
  revenue_change_pct?: number | null;
  expenses_change_pct?: number | null;
  net_profit_change_pct?: number | null;
  transactions_change_pct?: number | null;
}

export interface ActiveAlertRow {
  alert_id: number;
  alert_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string | null;
}

export interface FinancialOverview {
  labels: string[];
  revenue: number[];
  expenses: number[];
  net_profit: number[];
  cash_balance: number[];
}

export interface SalesTarget {
  business_name?: string;
  current_revenue: number;
  target_revenue: number;
  percentage: number;
}

export interface Transaction {
  transaction_id: number;
  transaction_date: string;
  type: string;
  category: string;
  amount: number;
  description: string;
}

export interface RevenueVsExpense {
  labels: string[];
  revenue: number[];
  expenses: number[];
}

export interface SalesTrend {
  labels: string[];
  revenue: number[];
  expenses: number[];
}

export interface AlertsBySeverity {
  labels: string[];
  data: number[];
}

export interface HealthScores {
  businesses: string[];
  scores: {
    name: string;
    overall: number;
    cash: number;
    profitability: number;
    growth: number;
    cost_control: number;
    risk: number;
  }[];
}

export interface TopProducts {
  labels: string[];
  stock: number[];
  margin: number[];
}

export interface EmployeeStats {
  labels: string[];
  counts: number[];
  avg_salary: number[];
}

export interface BusinessInfo {
  business_id: string;
  business_name: string;
  industry_type: string;
  owner_name: string;
  city: string;
  business_age: string;
  employees_range: string;
  monthly_revenue?: string;
  biggest_challenge: string;
  finance_tracking_method: string;
  onboarding_notes?: string;
  user_name?: string;
  user_email?: string;
}

function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  // First check URL for direct navigation/redirection from landing page
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get("user_email");
  if (emailParam) {
    // Priority: always use URL param and ensure localStorage is up to date
    try {
      const existingStr = localStorage.getItem("profit_pilot_user");
      const existing = existingStr ? JSON.parse(existingStr) : {};
      if (existing.email !== emailParam) {
        localStorage.setItem("profit_pilot_user", JSON.stringify({ ...existing, email: emailParam }));
      }
    } catch {
      localStorage.setItem("profit_pilot_user", JSON.stringify({ email: emailParam }));
    }
    return emailParam;
  }

  // Then check localStorage
  const userStr = localStorage.getItem("profit_pilot_user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.email || null;
  } catch {
    return null;
  }
}

function appendUserEmail(url: string): string {
  const email = getStoredUserEmail();
  if (!email) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}email=${encodeURIComponent(email)}`;
}

function withPeriod(url: string, period?: DashboardPeriod): string {
  if (!period) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}period=${period}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const isMockMode = typeof window !== "undefined" && localStorage.getItem("profitpilot_mock_mode") === "true";
  if (isMockMode) return {} as T;

  const res = await fetch(`${AGENT_API_BASE}${appendUserEmail(url)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  const isMockMode = typeof window !== "undefined" && localStorage.getItem("profitpilot_mock_mode") === "true";
  
  if (isMockMode) {
    // Delay slightly to simulate network and make transitions more visible
    await new Promise(r => setTimeout(r, 600));
    return fallback;
  }

  try {
    const finalUrl = appendUserEmail(url);
    const res = await fetch(`${AGENT_API_BASE}${finalUrl}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch {
    console.warn(`[API] ${url} unavailable — using mock data`);
    return fallback;
  }
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** SSE payloads from POST /api/chat/send (Flask mirrors /api/v1/query events). */
export type ChatSseEvent = {
  type: string;
  content?: string;
  status?: string;
  error?: string;
  intent_str?: string;
  clarification?: unknown;
};

/**
 * Streams the LangGraph SSE response from the agent (via Next rewrite to backend).
 * Do not use fetch().json() — the body is text/event-stream.
 */
export async function* streamChatSend(
  conversationId: string,
  message: string
): AsyncGenerator<ChatSseEvent> {
  const res = await fetch(`${AGENT_API_BASE}/api/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message }),
    cache: "no-store",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Chat API error: ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  function* parseBufferedBlocks(): Generator<ChatSseEvent> {
    while (buffer.includes("\n\n")) {
      const i = buffer.indexOf("\n\n");
      const raw = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 2);
      if (!raw.startsWith("data: ")) continue;
      const payload = raw.slice(6).trim();
      if (!payload) continue;
      try {
        yield JSON.parse(payload) as ChatSseEvent;
      } catch {
        /* skip malformed JSON */
      }
    }
  }

  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    if (done) buffer += decoder.decode();
    yield* parseBufferedBlocks();
    if (done) {
      const tail = buffer.trim();
      if (tail.startsWith("data: ")) {
        const payload = tail.slice(6).trim();
        if (payload) {
          try {
            yield JSON.parse(payload) as ChatSseEvent;
          } catch {
            /* ignore */
          }
        }
      }
      break;
    }
  }
}

export const api = {
  getSummary: (period?: DashboardPeriod) =>
    fetchWithFallback<DashboardSummary>(
      withPeriod("/api/dashboard/summary", period),
      period ? mockSummaryForPeriod(period) : mockSummary
    ),

  getFinancialOverview: (period?: DashboardPeriod) =>
    fetchWithFallback<FinancialOverview>(
      withPeriod("/api/dashboard/financial-overview", period),
      period ? mockFinancialOverviewForPeriod(period) : mockFinancialOverview
    ),

  getSalesTarget: (period?: DashboardPeriod) =>
    fetchWithFallback<SalesTarget>(
      withPeriod("/api/dashboard/sales-target", period),
      period ? mockSalesTargetForPeriod(period) : mockSalesTarget
    ),

  getRecentTransactions: (params?: {
    search?: string;
    category?: string;
    limit?: number;
    period?: DashboardPeriod;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.period) searchParams.set("period", params.period);
    const qs = searchParams.toString();
    const url = `/api/dashboard/recent-transactions${qs ? `?${qs}` : ""}`;

    return fetchWithFallback<{ transactions: Transaction[] }>(url, (() => {
      let txns = params?.period
        ? filterTransactionsByPeriod(params.period)
        : [...mockTransactions.transactions];
      if (params?.search) {
        const q = params.search.toLowerCase();
        txns = txns.filter(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            String(t.transaction_id).includes(q)
        );
      }
      if (params?.category) {
        txns = txns.filter((t) => t.category === params.category);
      }
      if (params?.limit) {
        txns = txns.slice(0, params.limit);
      }
      return { transactions: txns };
    })());
  },

  getCategories: () =>
    fetchWithFallback<{ categories: string[] }>("/api/dashboard/categories", mockCategories),

  getRevenueVsExpense: (period?: DashboardPeriod) =>
    fetchWithFallback<RevenueVsExpense>(
      withPeriod("/api/dashboard/revenue-vs-expense", period),
      period ? mockRevenueVsExpenseForPeriod(period) : mockRevenueVsExpense
    ),

  getSalesTrend: (period?: DashboardPeriod) =>
    fetchWithFallback<SalesTrend>(
      withPeriod("/api/dashboard/sales-trend", period),
      period ? mockSalesTrendForPeriod(period) : mockSalesTrend
    ),

  getAlertsBySeverity: (period?: DashboardPeriod) =>
    fetchWithFallback<AlertsBySeverity>(
      withPeriod("/api/dashboard/alerts-by-severity", period),
      period ? mockAlertsForPeriod(period) : mockAlertsBySeverity
    ),

  getHealthScores: () =>
    fetchWithFallback<HealthScores>("/api/dashboard/health-scores", mockHealthScores),

  getActiveAlerts: () =>
    fetchWithFallback<{ alerts: ActiveAlertRow[] }>(
      "/api/dashboard/alerts-list",
      {
        alerts: [
          {
            alert_id: 1,
            alert_type: "Cash Flow",
            severity: "Critical",
            message: "Projected cash balance may fall below ₹50,000 next month.",
            status: "Active",
            created_at: new Date().toISOString(),
          },
          {
            alert_id: 2,
            alert_type: "Inventory",
            severity: "Warning",
            message: "Top-selling item 'Blue Widget' is low on stock (under 15 units).",
            status: "Active",
            created_at: new Date().toISOString(),
          },
          {
            alert_id: 3,
            alert_type: "Revenue",
            severity: "Info",
            message: "Overall revenue is up 12% compared to last week—excellent growth!",
            status: "Active",
            created_at: new Date().toISOString(),
          },
        ],
      },
    ),

  getTopProducts: () =>
    fetchWithFallback<TopProducts>("/api/dashboard/top-products", mockTopProducts),

  getEmployeeStats: () =>
    fetchWithFallback<EmployeeStats>("/api/dashboard/employee-stats", mockEmployeeStats),

  getBusinessInfo: () =>
    fetchJson<BusinessInfo>("/api/dashboard/business-info").catch(() => null),

  /** Build a CSV snapshot for the selected period (summary + transactions). */
  exportDashboardCsv: async (period: DashboardPeriod) => {
    const [summary, txRes] = await Promise.all([
      fetchWithFallback<DashboardSummary>(
        withPeriod("/api/dashboard/summary", period),
        mockSummaryForPeriod(period)
      ),
      fetchWithFallback<{ transactions: Transaction[] }>((() => {
        const searchParams = new URLSearchParams();
        searchParams.set("period", period);
        searchParams.set("limit", "500");
        return `/api/dashboard/recent-transactions?${searchParams.toString()}`;
      })(), (() => {
        let txns = filterTransactionsByPeriod(period);
        return { transactions: txns.slice(0, 500) };
      })()),
    ]);
    const { start, end } = getPeriodBounds(period);
    const headerLines = [
      `Dashboard export,${periodLabel(period)}`,
      `Date range,${start} to ${end}`,
      "",
      "Metric,Value",
      `Total revenue,${summary.total_revenue}`,
      `Total expenses,${summary.total_expenses}`,
      `Net profit,${summary.net_profit}`,
      `Transactions,${summary.total_transactions}`,
      `Active alerts,${summary.active_alerts}`,
      "",
      "Txn ID,Date,Type,Category,Amount,Description",
    ];
    const rows = txRes.transactions.map((t) =>
      [
        String(t.transaction_id),
        t.transaction_date,
        t.type,
        t.category,
        String(t.amount),
        t.description,
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(",")
    );
    const csv = [...headerLines, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_${period}_${start}_${end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

};
