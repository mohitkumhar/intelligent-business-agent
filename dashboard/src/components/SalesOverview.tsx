"use client";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { api, SalesTarget } from "@/lib/api";
import { MoreHorizontalIcon } from "./Icons";

Chart.register(...registerables);

export default function SalesOverview() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [data, setData] = useState<SalesTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSalesTarget()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const pct = Math.min(data.percentage, 100);
    const remaining = 100 - pct;

    // Create gradient for filled portion
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, "#3B82F6");
    gradient.addColorStop(0.5, "#60A5FA");
    gradient.addColorStop(1, "#93C5FD");

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [pct, remaining],
            backgroundColor: [gradient, "#E2E8F0"],
            borderWidth: 0,
            circumference: 270,
            rotation: 225,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "78%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
    };
  }, [data]);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Sales Overview</div>
        <button style={{
          background: "none", border: "none",
          color: "var(--text-muted)", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <MoreHorizontalIcon size={20} />
        </button>
      </div>
      <div className="chart-body">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="gauge-container">
            <div className="gauge-chart">
              <canvas ref={chartRef}></canvas>
              <div className="gauge-center">
                <div className="gauge-value">{data?.percentage ?? 0}%</div>
                <div className="gauge-label">Sales Growth</div>
              </div>
            </div>
            <div className="gauge-stats">
              <div className="gauge-stat-item">
                <span className="gauge-stat-label">Sales</span>
                <span className="gauge-stat-value">
                  {formatCurrency(data?.current_revenue ?? 0)}
                </span>
              </div>
              <div className="gauge-stat-item">
                <span className="gauge-stat-label">Target</span>
                <span className="gauge-stat-value">
                  {formatCurrency(data?.target_revenue ?? 0)}
                </span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(data?.percentage ?? 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
