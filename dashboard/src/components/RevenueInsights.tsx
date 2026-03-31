"use client";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { api, FinancialOverview } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";

Chart.register(...registerables);

export default function RevenueInsights() {
  const { period } = useDashboardPeriod();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [data, setData] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    setLoading(true);
    api.getFinancialOverview(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Create gradient fill for revenue bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.9)");
    gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.6)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.3)");

    const shortLabels = data.labels.map((l) => {
      const parts = l.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return monthNames[parseInt(parts[1]) - 1] || l;
    });

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: shortLabels,
        datasets: [
          {
            label: "Earning",
            data: data.revenue,
            backgroundColor: gradient,
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Expenses",
            data: data.expenses,
            backgroundColor: "rgba(226, 232, 240, 0.8)",
            borderColor: "rgba(226, 232, 240, 1)",
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1E293B",
            titleFont: { family: "Inter", size: 12, weight: "bold" },
            bodyFont: { family: "Inter", size: 11 },
            padding: 14,
            cornerRadius: 10,
            displayColors: true,
            boxPadding: 6,
            callbacks: {
              label(ctx) {
                return `${ctx.dataset.label}: $${(ctx.parsed?.y ?? 0).toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "Inter", size: 11, weight: 500 },
              color: "#94A3B8",
            },
            border: { display: false },
          },
          y: {
            grid: {
              color: "rgba(0,0,0,0.04)",
            },
            ticks: {
              font: { family: "Inter", size: 11 },
              color: "#94A3B8",
              callback(value) {
                const num = Number(value);
                if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                return String(value);
              },
            },
            border: { display: false },
          },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
    };
  }, [data, view]);

  const totalRevenue = data ? data.revenue.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Revenue Insights</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span className="chart-subtitle">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#3B82F6" }}></span>
              Earning
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#E2E8F0" }}></span>
              Expenses
            </div>
          </div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${view === "monthly" ? "active" : ""}`}
              onClick={() => setView("monthly")}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${view === "yearly" ? "active" : ""}`}
              onClick={() => setView("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>
      <div className="chart-body">
        {loading ? (
          <div className="loading-spinner">Loading chart data...</div>
        ) : (
          <canvas ref={chartRef}></canvas>
        )}
      </div>
    </div>
  );
}
