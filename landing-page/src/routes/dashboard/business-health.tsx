import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { useTheme, themeVars } from "../../dashboard/ThemeContext";

export const Route = createFileRoute("/dashboard/business-health")({
  component: BusinessHealthPage,
});

function HealthDrivers({ range }: { range: "7" | "30" | "90" }) {
  const { theme } = useTheme();
  const t = themeVars[theme];
  const items = [
    { label: "Profit Margin", pct: range === "7" ? 75 : range === "30" ? 82 : 60 },
    { label: "Cash Flow Stability", pct: range === "7" ? 70 : range === "30" ? 65 : 55 },
    { label: "Expense Growth", pct: range === "7" ? 50 : range === "30" ? 40 : 35 },
  ];
  const getColor = (p: number) => p >= 70 ? "#6C63FF" : p >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ background: t.surface, borderRadius: "12px", padding: "20px", border: `1px solid ${t.border}`, transition: "background 0.3s" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: t.text, marginBottom: "4px" }}>What's Affecting Your Health</div>
      <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "20px" }}>Key impact drivers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, color: t.textSub }}>{item.label}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: getColor(item.pct) }}>{item.pct}%</span>
            </div>
            <div style={{ height: "7px", background: t.border, borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${item.pct}%`, background: getColor(item.pct), borderRadius: "99px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessHealthPage() {
  const [range, setRange] = React.useState<"7" | "30" | "90">("30");
  const { theme } = useTheme();
  const t = themeVars[theme];

  return (
    <DashboardLayout range={range} setRange={setRange} onOpenAdvisor={() => { }} activePage="health">
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: t.text }}>Business Health Detailed Report</div>
            <div style={{ fontSize: "12px", color: t.textMuted, marginTop: "2px" }}>Deep dive into your core metrics</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div style={{ background: t.surface, borderRadius: "12px", padding: "24px", border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: t.text, marginBottom: "20px", alignSelf: "flex-start" }}>Overall Health Score</div>
            <div style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke={t.border} strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#6C63FF" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * 78) / 100} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: t.text }}>78</span>
                <span style={{ fontSize: "12px", color: t.textMuted }}>/ 100</span>
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#10B981", marginTop: "16px", background: "rgba(16,185,129,0.1)", padding: "4px 12px", borderRadius: "20px" }}>+8 pts from last month</div>
          </div>

          <HealthDrivers range={range} />
        </div>

        <div style={{ background: t.surface, borderRadius: "12px", padding: "24px", border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: t.text, marginBottom: "16px" }}>AI Health Recommendations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "High Server Costs", desc: "AWS bill increased by 30%. Consider reserving instances.", type: "Warning" },
              { label: "Strong Revenue Growth", desc: "Consulting revenue up 15%. Good time to expand the team.", type: "Positive" }
            ].map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", padding: "16px", borderRadius: "10px", background: theme === "dark" ? "#1A1A1A" : "#F9FAFB", border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "20px" }}>{rec.type === "Warning" ? "⚠️" : "🚀"}</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: t.text, marginBottom: "4px" }}>{rec.label}</div>
                  <div style={{ fontSize: "12px", color: t.textSub, lineHeight: 1.5 }}>{rec.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
