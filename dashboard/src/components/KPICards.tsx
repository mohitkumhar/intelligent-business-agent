"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DashboardSummary } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";
import {
  DollarIcon,
  ReceiptIcon,
  TrendingUpIcon,
  ArrowsRepeatIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "./Icons";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function KPICards() {
  const { period } = useDashboardPeriod();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getSummary(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const cards = data
    ? [
      {
        label: "Total Revenue",
        value: loading ? "..." : `$${data?.total_revenue.toLocaleString()}`,
        change: loading ? "0%" : `${data?.revenue_change}%`,
        positive: !loading && (data?.revenue_change ?? 0) >= 0,
        icon: <DollarIcon size={18} />,
        accentColor: "#3B82F6",
        iconBg: "rgba(59, 130, 246, 0.1)",
        iconColor: "#3B82F6",
      },
      {
        label: "Total Expenses",
        value: loading ? "..." : `$${data?.total_expenses.toLocaleString()}`,
        change: loading ? "0%" : `${data?.expenses_change}%`,
        positive: !loading && (data?.expenses_change ?? 0) < 0, // Expenses down is positive
        icon: <ReceiptIcon size={18} />,
        accentColor: "#EF4444",
        iconBg: "rgba(239, 68, 68, 0.1)",
        iconColor: "#EF4444",
      },
      {
        label: "Net Profit",
        value: formatCurrency(data.net_profit),
        change: loading ? "0%" : `${data?.net_profit_change}%`,
        positive: !loading && (data?.net_profit_change ?? 0) >= 0,
        icon: <TrendingUpIcon size={18} />,
        iconBg: "#F0FDF4",
        iconColor: "#16A34A",
        accentColor: "#16A34A",
      },
      {
        label: "Transactions",
        value: formatNumber(data.total_transactions),
        change: loading ? "0%" : `${data?.transactions_change}%`,
        positive: !loading && (data?.transactions_change ?? 0) >= 0,
        icon: <ArrowsRepeatIcon size={18} />,
        iconBg: "#FFFBEB",
        iconColor: "#D97706",
        accentColor: "#D97706",
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
    <div style={styles.grid}>
      {cards.map((card) => {
        const cardContent = (
          <div
            style={styles.card}
            onMouseEnter={(e) => {
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
            {/* Top accent line */}
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

            {/* Header row: icon + label + info */}
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
                <span style={{ color: "#9CA3AF", cursor: "pointer" }} title={`${card.label} info`}>
                  <InfoIcon size={13} />
                </span>
              </div>
            </div>

            {/* Big Value */}
            <div style={styles.value}>{card.value}</div>

            {/* Badge */}
            {card.label === "Active Alerts" ? (
              <div
                style={{
                  ...styles.badge,
                  background: (data?.active_alerts ?? 0) > 0 ? "#FEF2F2" : "#F0FDF4",
                  color: (data?.active_alerts ?? 0) > 0 ? "#DC2626" : "#16A34A",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  {(data?.active_alerts ?? 0) > 0 ? "Critical" : "All Clear"}
                </span>
              </div>

            ) : (
              <div
                style={{
                  ...styles.badge,
                  background: card.positive ? "#F0FDF4" : "#FEF2F2",
                  color: card.positive ? "#16A34A" : "#DC2626",
                }}
              >
                <span style={{ fontSize: 12 }}>{card.positive ? "↑" : "↓"}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{card.change}</span>
              </div>
            )}
          </div>
        );

        return card.label === "Active Alerts" ? (
          <Link key={card.label} href="/alerts" style={{ textDecoration: "none" }}>
            {cardContent}
          </Link>
        ) : (
          <div key={card.label}>{cardContent}</div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    width: "100%",
    marginBottom: "40px",
  },
  card: {
    position: "relative",
    background: "var(--kpi-card-bg)",
    borderRadius: "12px",
    border: "1px solid var(--kpi-card-border)",
    boxShadow: "var(--shadow-card)",
    padding: "20px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, border-color 0.3s ease",
    cursor: "default",
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
    color: "var(--kpi-label-color)",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  value: {
    fontSize: "26px",
    fontWeight: 700,
    color: "var(--kpi-value-color)",
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
    background: "linear-gradient(90deg, var(--skeleton-from) 25%, var(--skeleton-mid) 50%, var(--skeleton-to) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "6px",
  },
};