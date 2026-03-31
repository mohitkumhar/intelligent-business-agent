"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DashboardPeriod } from "@/lib/dashboardPeriod";

type DashboardPeriodContextValue = {
  period: DashboardPeriod;
  setPeriod: (p: DashboardPeriod) => void;
};

const DashboardPeriodContext = createContext<DashboardPeriodContextValue | null>(null);

export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<DashboardPeriod>("this_month");
  const value = useMemo(() => ({ period, setPeriod }), [period]);
  return (
    <DashboardPeriodContext.Provider value={value}>
      {children}
    </DashboardPeriodContext.Provider>
  );
}

export function useDashboardPeriod(): DashboardPeriodContextValue {
  const ctx = useContext(DashboardPeriodContext);
  if (!ctx) {
    throw new Error("useDashboardPeriod must be used within DashboardPeriodProvider");
  }
  return ctx;
}
