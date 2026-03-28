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

const API_BASE = "";

export interface DashboardSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_transactions: number;
  active_alerts: number;
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** Try the real API first; if it fails, return mock data. */
async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(url);
  } catch {
    console.warn(`[API] ${url} unavailable — using mock data`);
    return fallback;
  }
}

export const api = {
  getSummary: () =>
    fetchWithFallback<DashboardSummary>("/api/dashboard/summary", mockSummary),

  getFinancialOverview: () =>
    fetchWithFallback<FinancialOverview>("/api/dashboard/financial-overview", mockFinancialOverview),

  getSalesTarget: () =>
    fetchWithFallback<SalesTarget>("/api/dashboard/sales-target", mockSalesTarget),

  getRecentTransactions: (params?: { search?: string; category?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    const url = `/api/dashboard/recent-transactions${qs ? `?${qs}` : ""}`;

    // For mock fallback, apply client-side filtering
    return fetchWithFallback<{ transactions: Transaction[] }>(url, (() => {
      let txns = [...mockTransactions.transactions];
      if (params?.search) {
        const q = params.search.toLowerCase();
        txns = txns.filter(t =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          String(t.transaction_id).includes(q)
        );
      }
      if (params?.category) {
        txns = txns.filter(t => t.category === params.category);
      }
      if (params?.limit) {
        txns = txns.slice(0, params.limit);
      }
      return { transactions: txns };
    })());
  },

  getCategories: () =>
    fetchWithFallback<{ categories: string[] }>("/api/dashboard/categories", mockCategories),

  getRevenueVsExpense: () =>
    fetchWithFallback<RevenueVsExpense>("/api/dashboard/revenue-vs-expense", mockRevenueVsExpense),

  getSalesTrend: () =>
    fetchWithFallback<SalesTrend>("/api/dashboard/sales-trend", mockSalesTrend),

  getAlertsBySeverity: () =>
    fetchWithFallback<AlertsBySeverity>("/api/dashboard/alerts-by-severity", mockAlertsBySeverity),

  getHealthScores: () =>
    fetchWithFallback<HealthScores>("/api/dashboard/health-scores", mockHealthScores),

  getTopProducts: () =>
    fetchWithFallback<TopProducts>("/api/dashboard/top-products", mockTopProducts),

  getEmployeeStats: () =>
    fetchWithFallback<EmployeeStats>("/api/dashboard/employee-stats", mockEmployeeStats),

  // Chatbot — no mock fallback (requires live backend)
  sendMessage: (conversationId: string, message: string) =>
    fetchJson<{ content: string; intent: string | null }>("/api/chat/send").then(() =>
      fetch(`${API_BASE}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, message }),
      }).then((r) => r.json())
    ),
};
