"use client";
import { useEffect, useState } from "react";
import { api, HealthScores as HealthScoresData } from "@/lib/api";
import { HeartPulseIcon } from "./Icons";

function getScoreColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "#ECFDF5";
  if (score >= 40) return "#FFFBEB";
  return "#FEF2F2";
}

export default function HealthScores() {
  const [data, setData] = useState<HealthScoresData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealthScores()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HeartPulseIcon size={18} color="#EF4444" />
          <span className="chart-title">Business Health Scores</span>
        </div>
      </div>
      <div style={{ padding: "0 4px" }}>
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : data && data.scores.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.scores.map((biz) => (
              <div key={biz.name} style={{
                background: "#F8FAFC",
                borderRadius: 12,
                padding: "16px 18px",
                border: "1px solid #E2E8F0",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>{biz.name}</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: getScoreColor(biz.overall),
                    background: getScoreBg(biz.overall),
                    padding: "4px 12px",
                    borderRadius: 20,
                  }}>
                    {biz.overall}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {[
                    { label: "Cash", value: biz.cash },
                    { label: "Profit", value: biz.profitability },
                    { label: "Growth", value: biz.growth },
                    { label: "Cost", value: biz.cost_control },
                    { label: "Risk", value: biz.risk },
                  ].map((metric) => (
                    <div key={metric.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {metric.label}
                      </div>
                      <div style={{
                        width: "100%",
                        height: 5,
                        background: "#E2E8F0",
                        borderRadius: 3,
                        overflow: "hidden",
                        marginBottom: 4,
                      }}>
                        <div style={{
                          width: `${metric.value}%`,
                          height: "100%",
                          background: getScoreColor(metric.value),
                          borderRadius: 3,
                          transition: "width 1s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(metric.value) }}>
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="loading-spinner">No health data available</div>
        )}
      </div>
    </div>
  );
}
