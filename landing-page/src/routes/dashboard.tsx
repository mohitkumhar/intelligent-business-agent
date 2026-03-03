import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "../dashboard/DashboardLayout";
import { useTheme, themeVars } from "../dashboard/ThemeContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type DateRange = "7" | "30" | "90";
type ActivityTab = "Activity" | "Queries";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const kpiData: Record<DateRange, { healthScore: number; cashRunway: number; cashStatus: string; netProfit: string; profitChange: string; alerts: number }> = {
  "7": { healthScore: 71, cashRunway: 138, cashStatus: "Healthy", netProfit: "₹3,210", profitChange: "+3.1%", alerts: 2 },
  "30": { healthScore: 78, cashRunway: 124, cashStatus: "Healthy", netProfit: "₹12,430", profitChange: "+8.2%", alerts: 3 },
  "90": { healthScore: 65, cashRunway: 98, cashStatus: "Caution", netProfit: "₹34,760", profitChange: "-2.4%", alerts: 5 },
};

const healthTrendData: Record<DateRange, { labels: string[]; revenue: number[]; expenses: number[]; health: number[] }> = {
  "7": {
    labels: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    revenue: [42000, 55000, 61000, 58000, 72000, 80000, 67000],
    expenses: [30000, 41000, 38000, 45000, 52000, 48000, 44000],
    health: [60, 63, 68, 66, 71, 78, 74],
  },
  "30": {
    labels: ["MAY", "JUN", "JUL", "AUG", "SEP", "OCT"],
    revenue: [120000, 145000, 168000, 205000, 185000, 160000],
    expenses: [90000, 105000, 118000, 130000, 122000, 115000],
    health: [45, 60, 75, 88, 82, 68],
  },
  "90": {
    labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP"],
    revenue: [95000, 112000, 130000, 148000, 155000, 165000, 172000, 168000, 160000],
    expenses: [82000, 95000, 108000, 115000, 118000, 122000, 125000, 120000, 115000],
    health: [38, 45, 50, 57, 64, 72, 74, 71, 67],
  },
};

const activityRows = [
  { event: "New expense recorded", type: "Expense", typeColor: "#6C63FF", typeBg: "#EEF2FF", impact: "Medium", impactColor: "#F59E0B", time: "2 hrs ago", impactBg: "#FFFBEB" },
  { event: "Health score updated", type: "System", typeColor: "#6C63FF", typeBg: "#EEF2FF", impact: "Info", impactColor: "#6B7280", time: "5 hrs ago", impactBg: "#F3F4F6" },
  { event: "Decision executed", type: "Decision", typeColor: "#8B5CF6", typeBg: "#F5F3FF", impact: "High", impactColor: "#EF4444", time: "1 day ago", impactBg: "#FEF2F2" },
  { event: "Revenue target met", type: "System", typeColor: "#6C63FF", typeBg: "#EEF2FF", impact: "Positive", impactColor: "#10B981", time: "2 days ago", impactBg: "#D1FAE5" },
];

const queryRows = [
  { event: "Why is profit low this month?", type: "Analysis", typeColor: "#8B5CF6", typeBg: "#F5F3FF", impact: "Answered", impactColor: "#10B981", time: "1 hr ago", impactBg: "#D1FAE5" },
  { event: "Should I spend ₹10k on ads?", type: "Decision", typeColor: "#6C63FF", typeBg: "#EEF2FF", impact: "Risky", impactColor: "#F59E0B", time: "3 hrs ago", impactBg: "#FFFBEB" },
  { event: "Is cash flow stable?", type: "Analysis", typeColor: "#8B5CF6", typeBg: "#F5F3FF", impact: "Caution", impactColor: "#EF4444", time: "Yesterday", impactBg: "#FEF2F2" },
];

const alertsData = [
  { id: 1, title: "AWS Spend Spike", severity: "CRITICAL", severityColor: "#EF4444", severityBg: "#FEF2F2", brief: "Cloud costs increased by 94% in the last 30 days, costing an extra ₹1,200.", details: "Your AWS billing spiked from ₹620 to ₹1,820 this month. The spike is attributed to EC2 t3.xlarge instances running 24/7 in us-east-1. Consider auto-scaling schedules and reserved instances to cut costs by ~40%." },
  { id: 2, title: "Subscription Churn", severity: "WARNING", severityColor: "#F59E0B", severityBg: "#FFFBEB", brief: "3 key accounts have been inactive or not logged in the last 60 days.", details: "Accounts: TechnoSolutions (₹450/mo), DigitalFirst (₹300/mo), and BrightMind (₹200/mo) haven't engaged in 60+ days. A re-engagement campaign could recover up to ₹950/month." },
  { id: 3, title: "Deployment Success", severity: "INFO", severityColor: "#6B7280", severityBg: "#F3F4F6", brief: "v2.1.4 update has been successfully pushed to your entire infrastructure.", details: "New version includes 25% faster API response, 3 security patches, and the new AI Advisor chat widget. Rollout completed with zero downtime across all 14 production servers." },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, change, changeDir, label, accent, icon }: {
  title: string; value: string; change?: string;
  changeDir?: "up" | "down" | "warn"; label?: string;
  accent: string; icon: React.ReactNode;
}) {
  const { theme } = useTheme();
  const t = themeVars[theme];
  const changeColor = changeDir === "up" ? "#10B981" : changeDir === "down" ? "#EF4444" : "#F59E0B";
  const labelColor = changeDir === "warn" ? { text: "#EF4444", bg: theme === "dark" ? "#3D1515" : "#FEE2E2" } : { text: "#10B981", bg: theme === "dark" ? "#0D2E1E" : "#D1FAE5" };
  const accentDark = theme === "dark" ? "rgba(108,99,255,0.15)" : accent;
  return (
    <div style={{ background: t.surface, borderRadius: "12px", padding: "18px 20px", border: `1px solid ${t.border}`, flex: 1, minWidth: 0, transition: "box-shadow 0.2s, background 0.3s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(108,99,255,0.12)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", fontWeight: 500, color: t.textSub }}>{title}</span>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: accentDark, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: t.text, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", minHeight: "20px" }}>
        {change && <span style={{ fontSize: "11px", fontWeight: 600, color: changeColor }}>{change}</span>}
        {label && <span style={{ fontSize: "11px", fontWeight: 600, color: labelColor.text, background: labelColor.bg, padding: "1px 7px", borderRadius: "20px" }}>{label}</span>}
      </div>
    </div>
  );
}

// ─── Proper SVG Line Chart ─────────────────────────────────────────────────────
function BusinessHealthTrend({ range }: { range: DateRange }) {
  const data = healthTrendData[range];
  const { theme } = useTheme();
  const t = themeVars[theme];
  const [visible, setVisible] = React.useState({ revenue: true, expenses: true, health: true });
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const W = 520; const H = 160;
  const padL = 44; const padR = 14; const padT = 12; const padB = 28;
  const cW = W - padL - padR; const cH = H - padT - padB;

  // Normalize revenue & expenses to 0-100 scale for overlay
  const maxRev = Math.max(...data.revenue);
  const normRev = data.revenue.map(v => (v / maxRev) * 100);
  const maxExp = Math.max(...data.expenses);
  const normExp = data.expenses.map(v => (v / maxExp) * 85); // cap at 85 so it doesn't overlap health completely

  const minY = 20; const maxY = 105; const yRange = maxY - minY;
  const n = data.labels.length;

  const getX = (i: number) => padL + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
  const getY = (val: number) => padT + cH - ((Math.min(Math.max(val, minY), maxY) - minY) / yRange) * cH;

  const makePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(" ");
  const makeArea = (vals: number[]) => {
    const base = padT + cH;
    return `${makePath(vals)} L${getX(n - 1).toFixed(1)},${base} L${getX(0).toFixed(1)},${base} Z`;
  };

  const series = [
    { key: "revenue" as const, label: "Revenue Index", color: "#6C63FF", vals: normRev },
    { key: "expenses" as const, label: "Expenses Index", color: "#F59E0B", vals: normExp },
    { key: "health" as const, label: "Health Score", color: "#10B981", vals: data.health },
  ];

  const yTicks = [20, 40, 60, 80, 100];

  const fmt = (key: string, rawIdx: number) => {
    if (key === "revenue") return `₹${(data.revenue[rawIdx] / 1000).toFixed(0)}k`;
    if (key === "expenses") return `₹${(data.expenses[rawIdx] / 1000).toFixed(0)}k`;
    return `${data.health[rawIdx]}`;
  };

  return (
    <div style={{ background: t.surface, borderRadius: "12px", padding: "20px", border: `1px solid ${t.border}`, transition: "background 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>Business Health Trend</div>
          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "2px" }}>
            {range === "7" ? "Daily" : range === "30" ? "Monthly" : "Quarterly"} Performance
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {series.map(s => (
            <button key={s.key} onClick={() => setVisible(v => ({ ...v, [s.key]: !v[s.key] }))}
              style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: visible[s.key] ? t.text : t.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0, opacity: visible[s.key] ? 1 : 0.45, transition: "opacity 0.2s" }}>
              <div style={{ width: "20px", height: "3px", background: s.color, borderRadius: "2px" }} />{s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
          onMouseLeave={() => setHoverIdx(null)}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid */}
          {yTicks.map(t => (
            <g key={t}>
              <line x1={padL} y1={getY(t)} x2={W - padR} y2={getY(t)} stroke="#F0F0F4" strokeWidth="1" />
              <text x={padL - 5} y={getY(t) + 3.5} textAnchor="end" fontSize="8.5" fill="#C4C9D4">{t}</text>
            </g>
          ))}

          {/* Hover column highlight */}
          {hoverIdx !== null && (
            <rect x={getX(hoverIdx) - cW / (2 * Math.max(n - 1, 1))} y={padT} width={cW / Math.max(n - 1, 1) + 0.5} height={cH}
              fill={theme === "dark" ? "rgba(108,99,255,0.10)" : "#F5F5FF"} rx="2" />
          )}

          {/* Area fills */}
          {series.filter(s => visible[s.key]).map(s => (
            <path key={`a-${s.key}`} d={makeArea(s.vals)} fill={`url(#g-${s.key})`} />
          ))}

          {/* Lines */}
          {series.filter(s => visible[s.key]).map(s => (
            <path key={`l-${s.key}`} d={makePath(s.vals)} fill="none" stroke={s.color}
              strokeWidth={s.key === "health" ? 2.5 : 2} strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={s.key === "expenses" ? "6,3" : undefined} />
          ))}

          {/* Dots on hover */}
          {hoverIdx !== null && series.filter(s => visible[s.key]).map(s => (
            <circle key={`d-${s.key}`} cx={getX(hoverIdx)} cy={getY(s.vals[hoverIdx])} r={4}
              fill={s.color} stroke="white" strokeWidth="2" />
          ))}

          {/* X labels */}
          {data.labels.map((lbl, i) => (
            <text key={lbl} x={getX(i)} y={H - 5} textAnchor="middle" fontSize="9" fill={t.textMuted} fontWeight="500">{lbl}</text>
          ))}

          {/* Invisible hover zones */}
          {data.labels.map((_, i) => (
            <rect key={`hz-${i}`} x={i === 0 ? 0 : (getX(i - 1) + getX(i)) / 2} y={0}
              width={i === 0 ? (getX(0) + getX(1)) / 2 : i === n - 1 ? W - (getX(i - 1) + getX(i)) / 2 : (getX(i + 1) - getX(i - 1)) / 2}
              height={H} fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHoverIdx(i)} />
          ))}
        </svg>

        {/* Tooltip */}
        {hoverIdx !== null && (
          <div style={{ position: "absolute", top: "10px", left: hoverIdx > n * 0.6 ? "auto" : `${(getX(hoverIdx) / W) * 100 + 2}%`, right: hoverIdx > n * 0.6 ? `${((W - getX(hoverIdx)) / W) * 100 + 2}%` : "auto", background: t.tooltipBg, borderRadius: "10px", padding: "9px 13px", pointerEvents: "none", zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", minWidth: "130px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", marginBottom: "7px", textTransform: "uppercase" }}>{data.labels[hoverIdx]}</div>
            {series.filter(s => visible[s.key]).map(s => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "#A0A8C0" }}>{s.label.split(" ")[0]}:</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "white", marginLeft: "auto" }}>{fmt(s.key, hoverIdx)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Health Drivers ────────────────────────────────────────────────────────────
function HealthDrivers({ range }: { range: DateRange }) {
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
              <div style={{ height: "100%", width: `${item.pct}%`, background: getColor(item.pct), borderRadius: "99px", transition: "width 0.9s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Activity ───────────────────────────────────────────────────────────
function RecentActivity() {
  const [tab, setTab] = React.useState<ActivityTab>("Activity");
  const { theme } = useTheme();
  const t = themeVars[theme];
  const rows = tab === "Activity" ? activityRows : queryRows;
  return (
    <div style={{ background: t.surface, borderRadius: "12px", padding: "20px", border: `1px solid ${t.border}`, transition: "background 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>Recent Activity</div>
          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "2px" }}>Latest business events and AI interactions</div>
        </div>
        <div style={{ display: "flex", background: t.btnSecBg, borderRadius: "8px", padding: "3px" }}>
          {(["Activity", "Queries"] as const).map(tabOption => (
            <button key={tabOption} onClick={() => setTab(tabOption)}
              style={{ padding: "4px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", background: tab === tabOption ? "#6C63FF" : "transparent", color: tab === tabOption ? "white" : t.textSub, transition: "all 0.15s" }}>
              {tabOption}
            </button>
          ))}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
            {["EVENT", "TYPE", "IMPACT", "TIME"].map(h => (
              <th key={h} style={{ textAlign: "left", fontSize: "10px", fontWeight: 700, color: t.textMuted, padding: "6px 8px", letterSpacing: "0.5px" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}
              onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "10px 8px", fontSize: "12px", fontWeight: 500, color: t.text }}>{row.event}</td>
              <td style={{ padding: "10px 8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: row.typeColor, background: row.typeBg, padding: "2px 8px", borderRadius: "20px" }}>{row.type}</span>
              </td>
              <td style={{ padding: "10px 8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: row.impactColor, background: row.impactBg, padding: "2px 8px", borderRadius: "20px" }}>{row.impact}</span>
              </td>
              <td style={{ padding: "10px 8px", fontSize: "11px", color: "#9CA3AF" }}>{row.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── AI Risk Alerts ────────────────────────────────────────────────────────────
function AIRiskAlerts() {
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [dismissed, setDismissed] = React.useState<number[]>([]);
  const { theme } = useTheme();
  const t = themeVars[theme];
  const visible = alertsData.filter(a => !dismissed.includes(a.id));

  if (visible.length === 0) {
    return (
      <div style={{ background: t.surface, borderRadius: "12px", padding: "24px", border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "220px", gap: "12px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>All Clear!</div>
        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>No active risk alerts at this moment.</div>
        <button onClick={() => setDismissed([])} style={{ fontSize: "11px", color: "#6C63FF", background: "none", border: "none", cursor: "pointer", fontWeight: 600, marginTop: "4px" }}>Reset</button>
      </div>
    );
  }

  return (
    <div style={{ background: t.surface, borderRadius: "12px", padding: "20px", border: `1px solid ${t.border}`, transition: "background 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>AI Risk Alerts</div>
          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "2px" }}>Automated monitoring</div>
        </div>
        <span style={{ fontSize: "10px", fontWeight: 700, background: theme === "dark" ? "#1C1C1C" : "#EEF2FF", color: "#6C63FF", padding: "2px 8px", borderRadius: "20px" }}>{visible.length} Active</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {visible.map(alert => (
          <div key={alert.id} style={{ border: `1px solid ${theme === "dark" ? alert.severityColor + "44" : alert.severityColor + "22"}`, borderRadius: "10px", overflow: "hidden", background: theme === "dark" ? "#1A1A1A" : "#FAFAFA" }}>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: theme === "dark" ? "rgba(255,255,255,0.06)" : alert.severityBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={alert.severityColor} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: t.text }}>{alert.title}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: alert.severityColor, background: theme === "dark" ? `${alert.severityColor}22` : alert.severityBg, padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>{alert.severity}</span>
              </div>
              <p style={{ fontSize: "11px", color: t.textSub, lineHeight: 1.5, margin: "0 0 8px 36px" }}>{alert.brief}</p>
              {expanded === alert.id && (
                <div style={{ margin: "8px 0 8px 36px", padding: "10px 12px", background: t.surfaceHover, borderRadius: "8px", fontSize: "11px", color: t.textSub, lineHeight: 1.7 }}>
                  {alert.details}
                </div>
              )}
              <div style={{ display: "flex", gap: "14px", marginLeft: "36px" }}>
                <button onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                  style={{ fontSize: "11px", fontWeight: 600, color: "#6C63FF", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {expanded === alert.id ? "Hide Details ↑" : "View Details →"}
                </button>
                <button onClick={() => { setDismissed(d => [...d, alert.id]); if (expanded === alert.id) setExpanded(null); }}
                  style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setDismissed(alertsData.map(a => a.id))}
        style={{ marginTop: "14px", width: "100%", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#6C63FF", background: "none", border: "none", cursor: "pointer" }}>
        Dismiss All
      </button>
    </div>
  );
}

// ─── AI Advisor Drawer ─────────────────────────────────────────────────────────
function AIAdvisorDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const t = themeVars[theme];
  const [messages, setMessages] = React.useState([
    { role: "ai" as const, text: "Hello! I'm your AI Business Advisor. Ask me anything about your business performance, decisions, or strategy. 🚀" }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  const suggested = [
    "Why is my profit low this month?",
    "Should I hire a new employee?",
    "Is cash flow stable?",
  ];

  const responses: Record<string, string> = {
    "Why is my profit low this month?": "Based on your financial data, profit is lower due to a 24% spike in operational expenses and a 3% dip in revenue. Main drivers: increased cloud costs (+₹1,200) and delayed client payments. I recommend reviewing AWS subscriptions and following up on 3 overdue invoices worth ~₹4,500.",
    "Should I hire a new employee?": "Based on current financials, your cash runway is 124 days and profit growth is +8.2%. Hiring now is viable but tight. Consider waiting until cash runway exceeds 150 days, or opt for a contract hire rather than full-time.",
    "Is cash flow stable?": "Cash flow shows moderate stability at 65%. You have a 124-day runway which is healthy. However, 3 accounts are at risk of churning (~₹950/mo). Immediate action: activate re-engagement for those accounts and review recurring expenses above ₹500/month.",
  };

  const send = (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    setTimeout(() => {
      const reply = responses[msg] ?? "Great question! Based on your current data, I recommend focusing on cost control and revenue diversification. Your health score of 78/100 is solid — targeting higher profitability is the next step. Want a detailed breakdown?";
      setMessages(m => [...m, { role: "ai", text: reply }]);
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 1200);
  };

  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "390px", background: t.surface, zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6C63FF, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" /></svg>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>AI Business Advisor</div>
              <div style={{ fontSize: "11px", color: "#10B981", display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />Online
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "ai" && (
                <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg, #6C63FF, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>
                  <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" /></svg>
                </div>
              )}
              <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px", background: m.role === "user" ? "linear-gradient(135deg, #6C63FF, #8B5CF6)" : "#F3F4F6", color: m.role === "user" ? "white" : "#374151", fontSize: "12px", lineHeight: 1.65 }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg, #6C63FF, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" /></svg>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "4px 14px 14px 14px", background: "#F3F4F6", display: "flex", gap: "4px", alignItems: "center" }}>
                {[0, 1, 2].map(d => <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9CA3AF", animation: "pulse 1s infinite", animationDelay: `${d * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggested */}
        <div style={{ padding: "8px 16px 0", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {suggested.map(q => (
            <button key={q} onClick={() => send(q)}
              style={{ fontSize: "10px", color: "#6C63FF", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: "20px", padding: "3px 10px", cursor: "pointer", fontWeight: 500 }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${t.border}`, marginTop: "8px", display: "flex", gap: "8px" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about your business..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.border}`, fontSize: "12px", outline: "none", color: t.text, background: t.inputBg }} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width: "38px", height: "38px", borderRadius: "10px", background: input.trim() && !loading ? "linear-gradient(135deg, #6C63FF, #8B5CF6)" : "#E5E7EB", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={input.trim() && !loading ? "white" : "#9CA3AF"} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
function DashboardPage() {
  const [range, setRange] = React.useState<DateRange>("30");
  const [advisorOpen, setAdvisorOpen] = React.useState(false);
  const kpi = kpiData[range];

  return (
    <>
      <DashboardLayout range={range} setRange={setRange} onOpenAdvisor={() => setAdvisorOpen(true)}>
        {/* KPI Row */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "18px" }}>
          <KpiCard title="Business Health Score" value={`${kpi.healthScore} / 100`}
            change={`${kpi.healthScore >= 75 ? "+" : ""}${kpi.healthScore - 70} pts from last month`}
            changeDir={kpi.healthScore >= 75 ? "up" : "down"} accent="#EEF2FF"
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6C63FF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          />
          <KpiCard title="Cash Runway" value={`${kpi.cashRunway} Days`} label={kpi.cashStatus}
            changeDir={kpi.cashStatus === "Healthy" ? "up" : "warn"} accent="#D1FAE5"
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard title="Net Profit (This Month)" value={kpi.netProfit} change={kpi.profitChange}
            changeDir={kpi.profitChange.startsWith("+") ? "up" : "down"} accent="#EEF2FF"
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6C63FF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <KpiCard title="Active Risk Alerts" value={String(kpi.alerts)}
            label={kpi.alerts <= 2 ? "Under Control" : "Needs Attention"}
            changeDir={kpi.alerts <= 2 ? "up" : "warn"} accent="#FEF2F2"
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
        </div>

        {/* Chart Row */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "14px", marginBottom: "18px" }}>
          <BusinessHealthTrend range={range} />
          <HealthDrivers range={range} />
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "14px" }}>
          <RecentActivity />
          <AIRiskAlerts />
        </div>
      </DashboardLayout>

      <AIAdvisorDrawer open={advisorOpen} onClose={() => setAdvisorOpen(false)} />
    </>
  );
}
