"use client";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { api, RevenueVsExpense } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";
import { PieChartIcon } from "./Icons";

Chart.register(...registerables);

export default function TransactionsByCategory() {
  const { period, dataVersion } = useDashboardPeriod();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [data, setData] = useState<RevenueVsExpense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRevenueVsExpense(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, dataVersion]);

  useEffect(() => {
    if (!data || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
      "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
    ];

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.revenue,
          backgroundColor: colors.slice(0, data.labels.length),
          borderWidth: 2,
          borderColor: "#FFFFFF",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { font: { family: "Inter", size: 11 }, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: "circle", padding: 12, color: "#64748B" },
          },
          tooltip: {
            backgroundColor: "#1E293B",
            titleFont: { family: "Inter", size: 12 },
            bodyFont: { family: "Inter", size: 11 },
            padding: 12,
            cornerRadius: 8,
            callbacks: { label: (ctx) => `${ctx.label}: $${ctx.parsed.toLocaleString()}` },
          },
        },
      },
    });

    return () => { chartInstance.current?.destroy(); };
  }, [data]);

  return (
    <div className="chart-card" key={dataVersion}>
      <div className="chart-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PieChartIcon size={18} color="var(--accent-green)" />
          <span className="chart-title">Transactions by Category</span>
        </div>
      </div>
      <div className="chart-body">
        {loading ? <div className="loading-spinner">Loading...</div> : <canvas ref={chartRef}></canvas>}
      </div>
    </div>
  );
}
