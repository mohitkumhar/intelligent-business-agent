import React, { useState } from "react";

export function BusinessHealthPreview() {
  const [selectedPeriod, setSelectedPeriod] = useState<"30d" | "90d" | "1y">("30d");

  const monthlySeries = [
    { month: "Nov", rev: 180, exp: 140, profit: 40 },
    { month: "Dec", rev: 220, exp: 160, profit: 60 },
    { month: "Jan", rev: 195, exp: 170, profit: 25 },
    { month: "Feb", rev: 240, exp: 175, profit: 65 },
    { month: "Mar", rev: 285, exp: 190, profit: 95 },
    { month: "Apr (Est)", rev: 310, exp: 200, profit: 110 },
  ];

  return (
    <section id="health-dashboard" className="py-20 bg-[#0B1120] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-sm font-bold text-emerald-400">
            📈 Live Executive Intelligence
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            Real-Time Business Health &{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Automated Warnings
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            ProfitPilot continuously audits revenue, expenses, and invoices. When risk thresholds are crossed, early warnings trigger before cash runs out.
          </p>
        </div>

        {/* Dashboard Preview Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl backdrop-blur-xl space-y-8">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-base font-bold text-white">ProfitPilot Executive Hub</span>
              <span className="text-xs px-3 py-1 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                PostgreSQL Live Sync
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {(["30d", "90d", "1y"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer ${
                    selectedPeriod === p
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 font-bold">HEALTH SCORE</div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400">74 / 100</div>
              <div className="text-sm text-emerald-300 flex items-center gap-1 font-mono font-bold">
                <span>↑ +6 pts</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 font-bold">CASH RUNWAY</div>
              <div className="text-4xl sm:text-5xl font-black text-white">58 Days</div>
              <div className="text-sm text-amber-400 flex items-center gap-1 font-mono font-bold">
                <span>₹1,74,000</span>
                <span className="text-slate-400 font-normal">liquid cushion</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 font-bold">GROSS MARGIN</div>
              <div className="text-4xl sm:text-5xl font-black text-cyan-400">32.4%</div>
              <div className="text-sm text-cyan-300 flex items-center gap-1 font-mono font-bold">
                <span>+4.2%</span>
                <span className="text-slate-400 font-normal">above category avg</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 font-bold">CAC : LTV EFFICIENCY</div>
              <div className="text-4xl sm:text-5xl font-black text-purple-400">1 : 3.8x</div>
              <div className="text-sm text-purple-300 flex items-center gap-1 font-mono font-bold">
                <span>Optimal</span>
                <span className="text-slate-400 font-normal">payback 22 days</span>
              </div>
            </div>
          </div>

          {/* Chart & Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Revenue vs Expense Visualization */}
            <div className="lg:col-span-7 p-8 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-sm font-mono font-bold text-slate-200 uppercase">
                  Revenue vs Expense Velocity (₹ Thousands)
                </span>
                <div className="flex items-center gap-4 text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-3 rounded bg-emerald-500" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-400">
                    <span className="w-3 h-3 rounded bg-orange-500" /> Expenses
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-4 pt-2">
                {monthlySeries.map((item, mIdx) => (
                  <div key={mIdx} className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between text-slate-300 font-mono text-xs font-bold">
                      <span>{item.month}</span>
                      <span className="text-emerald-300">Net Margin: +₹{item.profit}k</span>
                    </div>
                    <div className="flex items-center gap-2 h-5">
                      <div
                        style={{ width: `${(item.rev / 350) * 100}%` }}
                        className="h-full rounded-md bg-emerald-500/90 hover:bg-emerald-400 transition-all"
                        title={`Revenue: ₹${item.rev}k`}
                      />
                      <div
                        style={{ width: `${(item.exp / 350) * 100}%` }}
                        className="h-full rounded-md bg-orange-500/90 hover:bg-orange-400 transition-all"
                        title={`Expense: ₹${item.exp}k`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Warnings */}
            <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span className="text-sm font-mono font-bold text-white uppercase">
                    Automated Early Warning Feed
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">Live</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/40 text-sm space-y-1.5">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>⚠️ Ad CPA Surge Detected</span>
                    <span className="font-mono text-xs">2h ago</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    Meta Campaign CPA rose from ₹180 to ₹410. ProfitPilot recommends pausing campaign before ₹8,000 is wasted.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-950/40 border-2 border-red-500/40 text-sm space-y-1.5">
                  <div className="flex items-center justify-between text-red-300 font-bold">
                    <span>🚨 Overdue Receivable Alarm</span>
                    <span className="font-mono text-xs">5h ago</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    Client Delta Corp invoice of ₹55,000 is 32 days overdue. Cash runway at risk if unpaid by Friday.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/40 text-sm space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>✅ Inventory Restock Alert</span>
                    <span className="font-mono text-xs">1d ago</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    SKU 'Hydra Pack' daily velocity increased 2.4x. Reordering now avoids estimated ₹45,000 lost margin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
