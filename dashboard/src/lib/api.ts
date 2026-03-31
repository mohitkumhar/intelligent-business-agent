"use client";

import { AGENT_API_BASE } from "./publicUrls";

/**
 * Common Types for ProfitPilot API
 */
export interface DashboardSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_transactions: number;
  active_alerts: number;
  alert_highest_severity?: string | null;
  // Growth percentages (Kushal-dev logic)
  revenue_change: number;
  expenses_change: number;
  net_profit_change: number;
  transactions_change: number;
}

export interface Transaction {
  transaction_id: number;
  transaction_date: string;
  type: string;
  category: string;
  amount: number;
  description: string;
}

export interface Forecast {
  historical: { date: string; actual: number }[];
  forecast: { date: string; predicted: number; lower_bound: number; upper_bound: number }[];
  trend_direction: "up" | "down" | "stable";
  trend_percent: number;
  insight: string;
}

export interface BusinessInfo {
  business_id: string;
  business_name: string;
  industry_type: string;
  owner_name: string;
  city?: string;
  business_age?: string;
  employees_range?: string;
  monthly_revenue?: string;
  biggest_challenge?: string;
  finance_tracking_method?: string;
  user_name?: string;
  user_email?: string;
}

// Interfaces for Charts (Kushal-dev)
export interface RevenueVsExpense { labels: string[]; revenue: number[]; expenses: number[]; }
export interface SalesTrend { labels: string[]; revenue: number[]; expenses: number[]; }
export interface FinancialOverview { labels: string[]; revenue: number[]; expenses: number[]; net_profit: number[]; cash_balance: number[]; }
export interface AlertsBySeverity { labels: string[]; data: number[]; }
export interface TopProducts { labels: string[]; stock: number[]; margin: number[]; }
export interface EmployeeStats { labels: string[]; counts: number[]; avg_salary: number[]; }

// --- Auth & Email Sync Logic (From Testsparkhack) ---
function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get("user_email");
  if (emailParam) {
    try {
      const existing = JSON.parse(localStorage.getItem("profit_pilot_user") || "{}");
      if (existing.email !== emailParam) {
        localStorage.setItem("profit_pilot_user", JSON.stringify({ ...existing, email: emailParam }));
      }
    } catch {
      localStorage.setItem("profit_pilot_user", JSON.stringify({ email: emailParam }));
    }
    return emailParam;
  }
  try {
    return JSON.parse(localStorage.getItem("profit_pilot_user") || "{}").email || null;
  } catch { return null; }
}

function appendUserEmail(url: string): string {
  const email = getStoredUserEmail();
  if (!email) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}email=${encodeURIComponent(email)}`;
}

// --- API Wrapper Object ---
export const api = {
  getSummary: async (period: string): Promise<DashboardSummary> => {
    // Note: Humein summary-sql use karna hai growth metrics ke liye
    const res = await fetch(appendUserEmail(`/api/dashboard/summary-sql?period=${period}`));
    if (!res.ok) throw new Error("Summary API failed");
    return res.json();
  },

  getFinancialOverview: async () => {
    const res = await fetch(appendUserEmail(`/api/dashboard/financial-overview`));
    return res.json();
  },

  getRevenueVsExpense: async (period: string) => {
    const res = await fetch(appendUserEmail(`/api/dashboard/revenue-vs-expense?period=${period}`));
    return res.json();
  },

  getSalesTrend: async (period: string) => {
    const res = await fetch(appendUserEmail(`/api/dashboard/sales-trend?period=${period}`));
    return res.json();
  },

  getForecast: async (period: string): Promise<Forecast> => {
    const res = await fetch(appendUserEmail(`/api/dashboard/forecast?period=${period}`));
    if (!res.ok) {
        // Fallback to mock if AI service is down
        const { mockForecast } = await import("./mockData");
        return mockForecast;
    }
    return res.json();
  },

  getRecentTransactions: async (params: { search?: string; category?: string; limit?: number; period?: string; }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.period) query.set("period", params.period);
    const res = await fetch(appendUserEmail(`/api/dashboard/recent-transactions?${query.toString()}`));
    return res.json();
  },

  getAlertsList: async () => {
    const res = await fetch(appendUserEmail(`/api/dashboard/alerts-list`));
    return res.json();
  },

  getBusinessInfo: async (): Promise<BusinessInfo> => {
    const res = await fetch(appendUserEmail(`/api/dashboard/business-info`));
    return res.json();
  },

  // Other endpoints
  getCategories: async () => (await fetch(appendUserEmail(`/api/dashboard/categories`))).json(),
  getAlertsBySeverity: async () => (await fetch(appendUserEmail(`/api/dashboard/alerts-by-severity`))).json(),
  getHealthScores: async () => (await fetch(appendUserEmail(`/api/dashboard/health-scores`))).json(),
  getTopProducts: async () => (await fetch(appendUserEmail(`/api/dashboard/top-products`))).json(),
  getEmployeeStats: async () => (await fetch(appendUserEmail(`/api/dashboard/employee-stats`))).json(),
};

/**
 * Chat Streaming Logic (Testsparkhack)
 */
export async function* streamChatSend(conversationId: string, message: string) {
  const res = await fetch(`${AGENT_API_BASE}/api/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });
  if (!res.ok) throw new Error("Chat sequence failed");
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    while (buffer.includes("\n\n")) {
      const i = buffer.indexOf("\n\n");
      const raw = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 2);
      if (raw.startsWith("data: ")) yield JSON.parse(raw.slice(6));
    }
    if (done) break;
  }
}
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


