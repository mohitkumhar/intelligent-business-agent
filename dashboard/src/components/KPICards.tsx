"use client";
import { useEffect, useState } from "react";
import { api, DashboardSummary } from "@/lib/api";
import { DollarIcon, ReceiptIcon, TrendingUpIcon, ArrowsRepeatIcon, AlertTriangleIcon, InfoIcon } from "./Icons";

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
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSummary()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = data
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(data.total_revenue),
          change: "+4.9%",
          positive: true,
          icon: <DollarIcon size={20} />,
          iconClass: "revenue",
        },
        {
          label: "Total Expenses",
          value: formatCurrency(data.total_expenses),
          change: "+2.7%",
          positive: false,
          icon: <ReceiptIcon size={20} />,
          iconClass: "expense",
        },
        {
          label: "Net Profit",
          value: formatCurrency(data.net_profit),
          change: data.net_profit >= 0 ? "+4.9%" : "-2.1%",
          positive: data.net_profit >= 0,
          icon: <TrendingUpIcon size={20} />,
          iconClass: "profit",
        },
        {
          label: "Transactions",
          value: formatNumber(data.total_transactions),
          change: "+3.4%",
          positive: true,
          icon: <ArrowsRepeatIcon size={20} />,
          iconClass: "transactions",
        },
        {
          label: "Active Alerts",
          value: formatNumber(data.active_alerts),
          change: "",
          positive: false,
          icon: <AlertTriangleIcon size={20} />,
          iconClass: "alerts",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="kpi-card">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
            <div className="kpi-body">
              <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 80, height: 28, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 120, height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <div className={`kpi-icon ${card.iconClass}`}>
            {card.icon}
          </div>
          <div className="kpi-body">
            <div className="kpi-header">
              <span className="kpi-label">{card.label}</span>
              <span className="kpi-info" title={`${card.label} info`}>
                <InfoIcon size={13} />
              </span>
            </div>
            <div className="kpi-value">{card.value}</div>
            {card.change && (
              <div className={`kpi-change ${card.positive ? "positive" : "negative"}`}>
                <span>{card.positive ? "↑" : "↓"} {card.change}</span>
                <span className="change-label">From the Last month</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
