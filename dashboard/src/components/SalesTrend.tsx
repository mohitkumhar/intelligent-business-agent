"use client";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { api, SalesTrend as SalesTrendData } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";
import { LineChartIcon } from "./Icons";

Chart.register(...registerables);

export default function SalesTrend() {
  const { period } = useDashboardPeriod();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [data, setData] = useState<SalesTrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSalesTrend(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    if (!data || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Revenue",
            data: data.revenue,
            borderColor: "#3B82F6",
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#3B82F6",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            borderWidth: 2.5,
          },
          {
            label: "Expenses",
            data: data.expenses,
            borderColor: "#EF4444",
            backgroundColor: "transparent",
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#EF4444",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: { font: { family: "Inter", size: 11 }, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: "circle", padding: 16, color: "#64748B" },
          },
          tooltip: {
            backgroundColor: "#1E293B",
            titleFont: { family: "Inter", size: 12 },
            bodyFont: { family: "Inter", size: 11 },
            padding: 12,
            cornerRadius: 8,
            callbacks: { label: (ctx) => `${ctx.dataset.label}: $${(ctx.parsed?.y ?? 0).toLocaleString()}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "Inter", size: 11 }, color: "#94A3B8" }, border: { display: false } },
          y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "Inter", size: 11 }, color: "#94A3B8", callback(v) { const n = Number(v); return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(v); } }, border: { display: false } },
        },
      },
    });

    return () => { chartInstance.current?.destroy(); };
  }, [data]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LineChartIcon size={18} color="var(--accent-blue)" />
          <span className="chart-title">Sales Trend (Last 7 Days)</span>
        </div>
      </div>
      <div className="chart-body">
        {loading ? <div className="loading-spinner">Loading...</div> : <canvas ref={chartRef}></canvas>}
      </div>
    </div>
  );
}
