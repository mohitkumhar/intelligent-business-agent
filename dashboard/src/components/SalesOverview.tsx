"use client";
import { useEffect, useState } from "react";
import { api, SalesTarget } from "@/lib/api";
import { useDashboardPeriod } from "@/context/DashboardPeriodContext";

function SemiCircleGauge({ percentage }: { percentage: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = 75;
  const total = 12;
  const startAngle = -180;
  const endAngle = 0;
  const filledCount = Math.round((percentage / 100) * total);

  const segments = Array.from({ length: total }, (_, i) => {
    const angleStep = 180 / (total - 1);
    const angle = startAngle + i * angleStep;
    const rad = (angle * Math.PI) / 180;
    const innerR = r - 14;
    const outerR = r + 2;
    const gapAngle = 4;
    const startRad = ((angle - angleStep / 2 + gapAngle / 2) * Math.PI) / 180;
    const endRad = ((angle + angleStep / 2 - gapAngle / 2) * Math.PI) / 180;

    const x1 = cx + innerR * Math.cos(startRad);
    const y1 = cy + innerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(startRad);
    const y2 = cy + outerR * Math.sin(startRad);
    const x3 = cx + outerR * Math.cos(endRad);
    const y3 = cy + outerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(endRad);
    const y4 = cy + innerR * Math.sin(endRad);

    const isFilled = i < filledCount;
    // Multi-color blue gradient as requested: Dark blue -> Medium blue -> Light blue unfilled
    const fillColor = isFilled
      ? i < total * 0.4
        ? "#1D4ED8" // Dark blue
        : "#3B82F6" // Medium blue
      : "#DBEAFE"; // Unfilled light blue

    return (
      <path
        key={i}
        d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`}
        fill={fillColor}
        className="transition-all duration-700 ease-out"
        style={{ transitionDelay: `${i * 50}ms` }}
      />
    );
  });

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {segments}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill="#0F172A"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {percentage.toFixed(1)}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fontWeight="500"
          fill="#64748B"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Sales Growth
        </text>
      </svg>
    </div>
  );
}

export default function SalesOverview() {
  const { period } = useDashboardPeriod();
  const [data, setData] = useState<SalesTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSalesTarget(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const sales = data?.current_revenue ?? 3884.00;
  const target = data?.target_revenue ?? 20000.00;
  const percentage = data?.percentage ?? 70.8;
  const progressPercent = Math.min((sales / target) * 100, 100);

  return (
    <div className="chart-card flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[15px] font-semibold text-slate-900">Sales Overview</h3>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading metrics...
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* Gauge Section */}
          <div className="flex-1 flex items-center justify-center py-4">
            <SemiCircleGauge percentage={percentage} />
          </div>

          {/* Bottom Section */}
          <div className="mt-auto">
            <div className="border-t border-slate-100 my-4"></div>
            
            <div className="flex justify-between items-end mb-3">
              <div>
                <div className="text-[11px] font-medium text-slate-500 mb-0.5">Sales</div>
                <div className="text-base font-bold text-slate-900">${sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium text-slate-500 mb-0.5">Target</div>
                <div className="text-base font-bold text-slate-900">${target.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
