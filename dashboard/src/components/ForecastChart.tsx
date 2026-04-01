"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api, Forecast } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "./Icons";

export default function ForecastChart() {
  const { period } = useDashboardPeriod();
  const [data, setData] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getForecast(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">Revenue Forecast — Next 30 Days</h3>
        <div className="loading-spinner" style={{ height: "300px" }}>
          Predicting business trends...
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Combine historical and forecast for Recharts
  // Historical data has {date, actual}
  // Forecast data has {date, predicted, lower_bound, upper_bound}
  const combinedData = [
    ...data.historical.map(h => ({ ...h, type: 'historical' })),
    ...data.forecast.map(f => ({ ...f, type: 'forecast' }))
  ];

  const getTrendIcon = () => {
    switch (data.trend_direction) {
      case "up": return <TrendingUpIcon size={16} color="#10B981" />;
      case "down": return <TrendingDownIcon size={16} color="#EF4444" />;
      default: return <MinusIcon size={16} color="#6B7280" />;
    }
  };

  const trendColor = data.trend_direction === "up" ? "#DCFCE7" : data.trend_direction === "down" ? "#FEE2E2" : "#F3F4F6";
  const trendTextColor = data.trend_direction === "up" ? "#166534" : data.trend_direction === "down" ? "#991B1B" : "#374151";

  return (
    <div className="chart-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h3 className="chart-title" style={{ marginBottom: "4px" }}>Revenue Forecast — Next 30 Days</h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>AI-powered projections based on last 60 days</p>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          padding: "6px 12px", 
          borderRadius: "20px", 
          backgroundColor: trendColor,
          color: trendTextColor,
          fontSize: "14px",
          fontWeight: 600
        }}>
          {getTrendIcon()}
          <span>{data.trend_percent}% {data.trend_direction.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ height: "300px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="date" 
              hide={true}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              tickFormatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`}

            />
            <Tooltip 
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
              formatter={(value: any) => [`₹${Number(value || 0).toLocaleString("en-IN")}`, "Amount"]}
            />

            <Legend verticalAlign="top" height={36}/>
            
            {/* Confidence Band */}
            <Area
              type="monotone"
              dataKey="upper_bound"
              stroke="none"
              fill="#A855F7"
              fillOpacity={0.1}
              strokeWidth={0}
              connectNulls
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lower_bound"
              stroke="none"
              fill="#A855F7"
              fillOpacity={0.1}
              strokeWidth={0}
              connectNulls
              legendType="none"
            />

            {/* Historical */}
            <Area
              name="Historical Revenue"
              type="monotone"
              dataKey="actual"
              stroke="#2DD4BF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorActual)"
            />

            {/* Forecast */}
            <Area
              name="AI Prediction"
              type="monotone"
              dataKey="predicted"
              stroke="#A855F7"
              strokeWidth={3}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorPredicted)"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ 
        marginTop: "20px", 
        padding: "16px", 
        backgroundColor: "rgba(0,0,0,0.02)", 
        borderRadius: "12px",
        borderLeft: "4px solid #A855F7"
      }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#4B5563", lineHeight: "1.5" }}>
          <strong>💡 AI Insight:</strong> {data.insight}
        </p>
      </div>
    </div>
  );
}
