"use client";
import { useEffect, useState } from "react";
import { api, ActiveAlertRow, DashboardSummary } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";
import {
  DollarIcon,
  ReceiptIcon,
  TrendingUpIcon,
  ArrowsRepeatIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "./Icons";

/** INR — onboarding & KPIs use Indian revenue bands (K / L). */
function formatCurrency(value: number): string {
  const v = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (v >= 1e7) return `${sign}₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(2)} L`;
  if (v >= 1e3) return `${sign}₹${(v / 1e3).toFixed(1)} K`;
  return `${sign}₹${Math.round(v).toLocaleString("en-IN")}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function severityBadgeLabel(sev: string | null | undefined): string {
  if (!sev) return "Active";
  if (sev === "High") return "Critical";
  if (sev === "Medium") return "Medium";
  if (sev === "Low") return "Low";
  return sev;
}

export default function KPICards() {
  const { period, dataVersion } = useDashboardPeriod();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertRows, setAlertRows] = useState<ActiveAlertRow[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getSummary(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, dataVersion]);

  useEffect(() => {
    if (!alertsOpen) return;
    setAlertsLoading(true);
    api
      .getActiveAlerts()
      .then((r) => setAlertRows(r.alerts))
      .catch(console.error)
      .finally(() => setAlertsLoading(false));
  }, [alertsOpen]);

  useEffect(() => {
    if (!alertsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAlertsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alertsOpen]);

  const cards = data
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(data.total_revenue),
          change: formatPct(data.revenue_change_pct),
          positive:
            data.revenue_change_pct == null ? true : data.revenue_change_pct >= 0,
          icon: <DollarIcon size={18} />,
          iconBg: "#EFF6FF",
          iconColor: "#2563EB",
          accentColor: "#2563EB",
          kind: "metric" as const,
        },
        {
          label: "Total Expenses",
          value: formatCurrency(data.total_expenses),
          change: formatPct(data.expenses_change_pct),
          positive:
            data.expenses_change_pct == null ? false : data.expenses_change_pct <= 0,
          icon: <ReceiptIcon size={18} />,
          iconBg: "#FEF2F2",
          iconColor: "#DC2626",
          accentColor: "#DC2626",
          kind: "metric" as const,
        },
        {
          label: "Net Profit",
          value: formatCurrency(data.net_profit),
          change: formatPct(data.net_profit_change_pct),
          positive:
            data.net_profit_change_pct == null
              ? data.net_profit >= 0
              : data.net_profit_change_pct >= 0,
          icon: <TrendingUpIcon size={18} />,
          iconBg: "#F0FDF4",
          iconColor: "#16A34A",
          accentColor: "#16A34A",
          kind: "metric" as const,
        },
        {
          label: "Transactions",
          value: formatNumber(data.total_transactions),
          change: formatPct(data.transactions_change_pct),
          positive:
            data.transactions_change_pct == null
              ? true
              : data.transactions_change_pct >= 0,
          icon: <ArrowsRepeatIcon size={18} />,
          iconBg: "#FFFBEB",
          iconColor: "#D97706",
          accentColor: "#D97706",
          kind: "metric" as const,
        },
        {
          label: "Active Alerts",
          value: formatNumber(data.active_alerts),
          change: "",
          positive: false,
          icon: <AlertTriangleIcon size={18} />,
          iconBg: "#FEF2F2",
          iconColor: "#DC2626",
          accentColor: "#DC2626",
          kind: "alerts" as const,
        },
      ]
    : [];

  if (loading) {
    return (
      <div style={styles.grid}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={styles.card}>
            <div style={{ ...styles.skeleton, width: 40, height: 40, borderRadius: 10, marginBottom: 12 }} />
            <div style={{ ...styles.skeleton, width: "60%", height: 13, marginBottom: 10 }} />
            <div style={{ ...styles.skeleton, width: "45%", height: 28, marginBottom: 10 }} />
            <div style={{ ...styles.skeleton, width: "80%", height: 11 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div style={styles.grid} key={dataVersion}>
        {cards.map((card) => {
          const isAlerts = card.kind === "alerts";
          const clickable = isAlerts && data && data.active_alerts > 0;
          const badgeLabel = isAlerts
            ? severityBadgeLabel(data?.alert_highest_severity)
            : null;
          return (
            <div
              key={card.label}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={() => {
                if (clickable) setAlertsOpen(true);
              }}
              onKeyDown={(e) => {
                if (clickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setAlertsOpen(true);
                }
              }}
              style={{
                ...styles.card,
                cursor: clickable ? "pointer" : "default",
              }}
              onMouseEnter={(e) => {
                if (!clickable) return;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 8px 24px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 1px 4px rgba(0,0,0,0.04)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: card.accentColor,
                  borderRadius: "12px 12px 0 0",
                  opacity: 0.7,
                }}
              />

              <div style={styles.headerRow}>
                <div
                  style={{
                    ...styles.iconBox,
                    background: card.iconBg,
                    color: card.iconColor,
                  }}
                >
                  {card.icon}
                </div>
                <div style={styles.labelGroup}>
                  <span style={styles.label}>{card.label}</span>
                  <span style={{ color: "#9CA3AF", cursor: "default" }} title={`${card.label}`}>
                    <InfoIcon size={13} />
                  </span>
                </div>
              </div>

              <div style={styles.value}>{card.value}</div>

              {isAlerts ? (
                <div
                  style={{
                    ...styles.badge,
                    background: data?.active_alerts ? "#FEF2F2" : "#F1F5F9",
                    color: data?.active_alerts ? "#DC2626" : "#64748B",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600 }}>
                    {data?.active_alerts ? badgeLabel : "None"}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    ...styles.badge,
                    background:
                      card.change === "—"
                        ? "#F8FAFC"
                        : card.positive
                          ? "#F0FDF4"
                          : "#FEF2F2",
                    color:
                      card.change === "—"
                        ? "#64748B"
                        : card.positive
                          ? "#16A34A"
                          : "#DC2626",
                  }}
                >
                  {card.change === "—" ? (
                    <span style={{ fontSize: 12, fontWeight: 600 }}>—</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 12 }}>{card.positive ? "↑" : "↓"}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{card.change}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {alertsOpen && (
        <div
          role="presentation"
          style={styles.modalBackdrop}
          onClick={() => setAlertsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="alerts-modal-title"
            style={styles.modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2 id="alerts-modal-title" style={styles.modalTitle}>
                Active alerts
              </h2>
              <button type="button" style={styles.modalClose} onClick={() => setAlertsOpen(false)}>
                ×
              </button>
            </div>
            {alertsLoading ? (
              <p style={{ color: "#64748B", margin: 0 }}>Loading…</p>
            ) : alertRows.length === 0 ? (
              <p style={{ color: "#64748B", margin: 0 }}>No active alerts.</p>
            ) : (
              <ul style={styles.alertList}>
                {alertRows.map((a) => (
                  <li key={a.alert_id} style={styles.alertItem}>
                    <div style={styles.alertTop}>
                      <span
                        style={{
                          ...styles.sevPill,
                          background:
                            a.severity === "High"
                              ? "#FEF2F2"
                              : a.severity === "Medium"
                                ? "#FFFBEB"
                                : "#F1F5F9",
                          color:
                            a.severity === "High"
                              ? "#DC2626"
                              : a.severity === "Medium"
                                ? "#D97706"
                                : "#475569",
                        }}
                      >
                        {severityBadgeLabel(a.severity)}
                      </span>
                      {a.alert_type ? (
                        <span style={{ fontSize: 12, color: "#64748B" }}>{a.alert_type}</span>
                      ) : null}
                    </div>
                    <p style={styles.alertMessage}>{a.message || "—"}</p>
                    {a.created_at ? (
                      <p style={styles.alertMeta}>{new Date(a.created_at).toLocaleString()}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    width: "100%",
  },
  card: {
    position: "relative",
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #F1F5F9",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    padding: "20px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    overflow: "hidden",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },
  iconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  labelGroup: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  label: {
    fontSize: "13px",
    color: "#6B7280",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  value: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
    margin: "4px 0",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: "4px 8px",
    borderRadius: "6px",
    width: "fit-content",
    marginTop: "4px",
  },
  skeleton: {
    background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "6px",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalPanel: {
    background: "#fff",
    borderRadius: 16,
    maxWidth: 480,
    width: "100%",
    maxHeight: "min(80vh, 520px)",
    overflow: "auto",
    padding: "20px 22px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0F172A",
  },
  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    color: "#64748B",
    padding: "0 4px",
  },
  alertList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  alertItem: {
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    padding: "12px 14px",
  },
  alertTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  sevPill: {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 6,
  },
  alertMessage: {
    margin: 0,
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 1.45,
  },
  alertMeta: {
    margin: "8px 0 0",
    fontSize: 11,
    color: "#94A3B8",
  },
};
