"use client";

/**
 * Common Types for the Business Intelligence Agent API
 */

export interface DashboardSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_transactions: number;
  active_alerts: number;
  revenue_change: number;
  expenses_change: number;
  net_profit_change: number;
  transactions_change: number;
}


export interface FinancialOverview {
  labels: string[];
  revenue: number[];
  expenses: number[];
  net_profit: number[];
  cash_balance: number[];
}

export interface SalesTarget {
  business_name: string;
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

export interface Alert {
  alert_id: number;
  alert_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}


export interface HealthScores {
  businesses: string[];
  scores: Array<{
    name: string;
    overall: number;
    cash: number;
    profitability: number;
    growth: number;
    cost_control: number;
    risk: number;
  }>;
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
  onboarding_notes?: string;
}

/**
 * API Wrapper for dashboard components
 */
export const api = {
  getSummary: async (period: string): Promise<DashboardSummary> => {
    const res = await fetch(`/api/dashboard/summary?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch dashboard summary");
    return res.json();
  },

  getFinancialOverview: async (period: string): Promise<FinancialOverview> => {
    const res = await fetch(`/api/dashboard/financial-overview?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch financial overview");
    return res.json();
  },

  getRevenueVsExpense: async (period: string): Promise<RevenueVsExpense> => {
    const res = await fetch(`/api/dashboard/revenue-vs-expense?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch revenue vs expense");
    return res.json();
  },

  getSalesTrend: async (period: string): Promise<SalesTrend> => {
    const res = await fetch(`/api/dashboard/sales-trend?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch sales trend");
    return res.json();
  },

  getRecentTransactions: async (params: {
    search?: string;
    category?: string;
    limit?: number;
    period?: string;
  }): Promise<{ transactions: Transaction[] }> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.period) query.set("period", params.period);

    const res = await fetch(`/api/dashboard/recent-transactions?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  },

  getCategories: async (): Promise<{ categories: string[] }> => {
    const res = await fetch(`/api/dashboard/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },

  getAlertsBySeverity: async (period: string): Promise<AlertsBySeverity> => {
    const res = await fetch(`/api/dashboard/alerts-by-severity?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch alerts by severity");
    return res.json();
  },

  getAlertsList: async (limit: number = 50): Promise<{ alerts: Alert[] }> => {
    const res = await fetch(`/api/dashboard/alerts?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch alerts list");
    return res.json();
  },


  getHealthScores: async (): Promise<HealthScores> => {
    const res = await fetch(`/api/dashboard/health-scores`);
    if (!res.ok) throw new Error("Failed to fetch health scores");
    return res.json();
  },

  getTopProducts: async (): Promise<TopProducts> => {
    const res = await fetch(`/api/dashboard/top-products`);
    if (!res.ok) throw new Error("Failed to fetch top products");
    return res.json();
  },

  getEmployeeStats: async (): Promise<EmployeeStats> => {
    const res = await fetch(`/api/dashboard/employee-stats`);
    if (!res.ok) throw new Error("Failed to fetch employee statistics");
    return res.json();
  },

  getSalesTarget: async (period: string): Promise<SalesTarget> => {
    const res = await fetch(`/api/dashboard/sales-target?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch sales target");
    return res.json();
  },

  getBusinessInfo: async (): Promise<BusinessInfo> => {
    const res = await fetch(`/api/dashboard/business-info`);
    if (!res.ok) throw new Error("Failed to fetch business information");
    return res.json();
  },

  getForecast: async (period: string): Promise<Forecast> => {
    // Attempt real fetch, fallback to a local mock generator if backend is unavailable
    try {
      const res = await fetch(`/api/dashboard/forecast?period=${period}`);
      if (!res.ok) throw new Error("Backend error");
      return await res.json();
    } catch (err) {
      console.warn("Forecast API failed, using mock data:", err);
      const { mockForecast } = await import("./mockData");
      return mockForecast;
    }
  },

  exportDashboardCsv: async (period: string): Promise<void> => {

    // Current backend doesn't support this yet, so we'll simulate success
    console.log(`Exporting dashboard data for ${period}...`);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  },
};
