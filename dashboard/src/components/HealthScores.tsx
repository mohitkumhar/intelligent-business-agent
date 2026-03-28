"use client";
import { useEffect, useState } from "react";
import { api, HealthScores as HealthScoresData } from "@/lib/api";
import { HeartPulseIcon } from "./Icons";

function getScoreColor(score: number): string {
  if (score >= 75) return "#10B981"; // Excellent
  if (score >= 60) return "#F59E0B"; // Good
  return "#EF4444"; // At Risk
}

function getScoreBg(score: number): string {
  if (score >= 75) return "#ECFDF5";
  if (score >= 60) return "#FFFBEB";
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
    <div className="chart-card h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
          <HeartPulseIcon size={18} color="#EF4444" />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900">Business Health Scores</h3>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Calculating scores...
          </div>
        ) : data && data.scores.length > 0 ? (
          <div className="space-y-6">
            {data.scores.map((biz) => (
              <div key={biz.name} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-sm font-semibold text-slate-900">{biz.name}</span>
                  <div className="px-3 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm"
                    style={{
                      color: getScoreColor(biz.overall),
                      background: "white",
                      border: `1px solid ${getScoreBg(biz.overall)}`
                    }}>
                    {biz.overall}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: "Cash", value: biz.cash },
                    { label: "Profit", value: biz.profitability },
                    { label: "Growth", value: biz.growth },
                    { label: "Cost", value: biz.cost_control },
                    { label: "Risk", value: biz.risk },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center group">
                      <div className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">
                        {metric.label}
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2 relative">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${metric.value}%`,
                            background: getScoreColor(metric.value),
                          }}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
            No health data available
          </div>
        )}
      </div>
    </div>
  );
}