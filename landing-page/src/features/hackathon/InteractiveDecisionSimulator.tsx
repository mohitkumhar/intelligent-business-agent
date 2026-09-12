import React, { useState } from "react";

interface ScenarioResult {
  title: string;
  query: string;
  status: "SAFE ✅" | "RISKY ⚠️" | "PROHIBITED ❌";
  statusColor: string;
  badgeBg: string;
  runwayBefore: string;
  runwayAfter: string;
  payback: string;
  confidence: string;
  executiveSummary: string;
  agentAdvice: string;
  executionTrace: { node: string; time: string; status: string; detail: string }[];
}

export function InteractiveDecisionSimulator({
  presetQuery,
}: {
  presetQuery?: string;
}) {
  const [customInput, setCustomInput] = useState<string>(
    presetQuery || "Should I spend ₹30,000 on influencer marketing this week?"
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);

  const scenarios: ScenarioResult[] = [
    {
      title: "Marketing Spend",
      query: "Should I spend ₹30,000 on influencer marketing this week?",
      status: "RISKY ⚠️",
      statusColor: "text-amber-400",
      badgeBg: "bg-amber-500/20 border-amber-500/50 text-amber-300",
      runwayBefore: "48 Days (₹1,44,000)",
      runwayAfter: "28 Days (₹84,000)",
      payback: "Estimated 45–60 Days",
      confidence: "88% Model Confidence",
      executiveSummary:
        "High upfront cash drain relative to your current reserves. Payback latency will cause an acute working capital bottleneck before receivables arrive.",
      agentAdvice:
        "💡 Counter-Proposal: Allocate ₹6,500 on 2 micro-influencers with tracked affiliate links first. Review ROAS after 5 days before releasing larger tranches.",
      executionTrace: [
        { node: "authenticate_request", time: "12ms", status: "OK", detail: "Tenant verified (Org: CloudKraft SMB-884)" },
        { node: "intent_detection", time: "42ms", status: "OK", detail: "Detected: [database_request, financial_risk_assessment]" },
        { node: "resolve_data_range", time: "18ms", status: "OK", detail: "Time window: Historical 90d + Forward 60d cash projection" },
        { node: "fetch_table_schema & sql_generation", time: "38ms", status: "OK", detail: "SELECT * FROM daily_transactions WHERE org_id=884" },
        { node: "business_insight_generator", time: "55ms", status: "OK", detail: "Runway stress test: -41.6% liquidity drop flagged" },
        { node: "format_response", time: "15ms", status: "OK", detail: "Stream response prepared with warning & counter-proposal" },
      ],
    },
    {
      title: "Hiring Expansion",
      query: "Can we afford to hire 2 Full-time Sales Execs at ₹40,000/mo each?",
      status: "PROHIBITED ❌",
      statusColor: "text-red-400",
      badgeBg: "bg-red-500/20 border-red-500/50 text-red-300",
      runwayBefore: "42 Days (₹1,26,000)",
      runwayAfter: "16 Days (Severe Liquidity Crisis)",
      payback: "Uncertain (> 90 Days)",
      confidence: "94% Model Confidence",
      executiveSummary:
        "Adding ₹80,000 in monthly fixed payroll increases baseline burn rate by 63%. Current sales pipeline does not generate enough margin to cover ramp-up period.",
      agentAdvice:
        "💡 Counter-Proposal: Hire commission-based freelance closers (15% per closed deal) or 1 contractor for 60 days to validate lead volume before taking on fixed recurring liabilities.",
      executionTrace: [
        { node: "authenticate_request", time: "10ms", status: "OK", detail: "Tenant verified (Org: CloudKraft SMB-884)" },
        { node: "intent_detection", time: "39ms", status: "OK", detail: "Detected: [database_request, headcount_budget_check]" },
        { node: "resolve_data_range", time: "15ms", status: "OK", detail: "Time window: Last 6 months payroll vs monthly ARR" },
        { node: "sql_generation & validation", time: "34ms", status: "OK", detail: "Validated safe SELECT query on employee_payroll & revenue" },
        { node: "business_insight_generator", time: "60ms", status: "CRITICAL", detail: "Runway exhaustion threshold crossed: < 20 days" },
        { node: "format_response", time: "14ms", status: "OK", detail: "Returned HIGH RISK warning and variable commission alternative" },
      ],
    },
    {
      title: "Inventory Reorder",
      query: "Should we reorder 1,000 units of best-selling SKU 'Pro Audio Pods'?",
      status: "SAFE ✅",
      statusColor: "text-emerald-400",
      badgeBg: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
      runwayBefore: "54 Days (₹2,10,000)",
      runwayAfter: "49 Days (₹1,60,000 - Quick Return)",
      payback: "18 Days (High Turnover)",
      confidence: "96% Model Confidence",
      executiveSummary:
        "SKU-A has a 94% sell-through rate within 21 days with 38% gross margin. Stock is currently at 4 units (stockout in 3 days). Failure to reorder will lose ₹72,000 in revenue.",
      agentAdvice:
        "💡 Recommendation: Approve immediately. Negotiate 5% bulk discount with supplier for 1,000 units. Expected net cash generation: +₹64,000 within 25 days.",
      executionTrace: [
        { node: "authenticate_request", time: "11ms", status: "OK", detail: "Tenant verified (Org: CloudKraft SMB-884)" },
        { node: "intent_detection", time: "36ms", status: "OK", detail: "Detected: [database_request, inventory_turnover_analysis]" },
        { node: "fetch_table_schema & sql_generation", time: "30ms", status: "OK", detail: "SELECT stock, sell_velocity, margin FROM inventory" },
        { node: "business_insight_generator", time: "48ms", status: "OK", detail: "Stockout risk detected; ROI calculation: 3.8x payback" },
        { node: "format_response", time: "12ms", status: "OK", detail: "Safe approval with supplier negotiation suggestion" },
      ],
    },
    {
      title: "Annual Discount",
      query: "Should we offer 35% discount for customers who pay annually upfront?",
      status: "SAFE ✅",
      statusColor: "text-emerald-400",
      badgeBg: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
      runwayBefore: "35 Days (₹1,05,000)",
      runwayAfter: "78 Days (Immediate Cash Inflow)",
      payback: "Immediate Working Capital",
      confidence: "91% Model Confidence",
      executiveSummary:
        "Upfront annual discounting sacrifices long-term margin slightly but solves short-term cash tightness instantly by bringing in ₹1,80,000 in upfront liquidity.",
      agentAdvice:
        "💡 Recommendation: Safe to launch as a limited-time 7-day promotion for the top 50 active monthly subscribers to boost cash cushion without dilution.",
      executionTrace: [
        { node: "authenticate_request", time: "9ms", status: "OK", detail: "Tenant verified (Org: CloudKraft SMB-884)" },
        { node: "intent_detection", time: "34ms", status: "OK", detail: "Detected: [database_request, discount_cashflow_model]" },
        { node: "business_insight_generator", time: "52ms", status: "OK", detail: "Working capital injection model: +₹1.8L cash surge" },
        { node: "format_response", time: "14ms", status: "OK", detail: "Approved recommendation with 7-day limited exclusivity" },
      ],
    },
  ];

  const currentResult = scenarios[selectedScenarioIndex];

  const handleRunSimulation = (index?: number) => {
    setIsSimulating(true);
    if (typeof index === "number") {
      setSelectedScenarioIndex(index);
      setCustomInput(scenarios[index].query);
    }
    setTimeout(() => {
      setIsSimulating(false);
    }, 300);
  };

  return (
    <section id="simulator" className="py-20 bg-[#090D16] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/40 text-sm font-bold text-orange-400">
            🎮 Interactive Judge Sandbox
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            Test the Pre-Decision{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Risk Simulator
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            Click any test scenario below to evaluate cash impact and view real-time LangGraph agent traces.
          </p>
        </div>

        {/* Preset Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {scenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => handleRunSimulation(idx)}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedScenarioIndex === idx
                  ? "bg-slate-800 border-orange-400 shadow-2xl shadow-orange-950/60 ring-2 ring-orange-400/40"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-400">{sc.title}</span>
                <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${sc.badgeBg}`}>
                  {sc.status}
                </span>
              </div>
              <p className="text-sm text-white font-bold line-clamp-2">"{sc.query}"</p>
            </button>
          ))}
        </div>

        {/* Simulation Output Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl backdrop-blur-xl space-y-8">
          {/* Query Bar */}
          <div className="flex flex-col sm:flex-row gap-3.5">
            <div className="flex-1 p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center gap-3.5">
              <span className="text-orange-400 text-xl">💬</span>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ask ProfitPilot any financial or growth dilemma..."
                className="w-full bg-transparent text-base text-white focus:outline-none placeholder:text-slate-500 font-medium"
              />
            </div>
            <button
              onClick={() => handleRunSimulation()}
              disabled={isSimulating}
              className="px-8 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-slate-950 cursor-pointer transition-all flex items-center justify-center gap-2.5 shrink-0 shadow-lg shadow-orange-500/25"
            >
              {isSimulating ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Simulating Agent...</span>
                </>
              ) : (
                <>
                  <span>Simulate Decision</span>
                  <span className="text-lg">⚡</span>
                </>
              )}
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Verdict & Numbers */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-6">
                {/* Verdict Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">PROFITPILOT RISK VERDICT</span>
                    <div className={`text-3xl sm:text-4xl font-black ${currentResult.statusColor} flex items-center gap-3 mt-1`}>
                      {currentResult.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-400">CONFIDENCE</span>
                    <div className="text-base font-bold text-slate-200 font-mono mt-1">{currentResult.confidence}</div>
                  </div>
                </div>

                {/* Key Metric Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs text-slate-400 font-mono font-bold">RUNWAY BEFORE</div>
                    <div className="text-base sm:text-lg font-black text-white">{currentResult.runwayBefore}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs text-slate-400 font-mono font-bold">PROJECTED RUNWAY</div>
                    <div className="text-base sm:text-lg font-black text-orange-300">{currentResult.runwayAfter}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs text-slate-400 font-mono font-bold">EST. PAYBACK</div>
                    <div className="text-base sm:text-lg font-black text-blue-300">{currentResult.payback}</div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2 text-base text-slate-200 leading-relaxed bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <span className="font-bold text-white text-base block">Financial Stress Assessment:</span>
                  <p>{currentResult.executiveSummary}</p>
                </div>

                {/* Advice */}
                <div className="p-5 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/50 text-base text-emerald-100 leading-relaxed font-medium">
                  <span className="font-black text-emerald-300 block mb-1 text-base">Autonomous Co-Pilot Recommendation:</span>
                  <p>{currentResult.agentAdvice}</p>
                </div>
              </div>
            </div>

            {/* Right: LangGraph Execution Trace */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-mono font-bold text-white">LangGraph Agent Trace</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  ~180ms Latency
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {currentResult.executionTrace.map((trace, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1 font-mono"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-400 font-bold">▶ {trace.node}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{trace.time}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {trace.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 pl-3">{trace.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
