import React, { useState } from "react";

export function SolutionPillars() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const pillars = [
    {
      id: "risk-engine",
      title: "1. Pre-Decision Risk Simulator",
      short: "Risk Guardrail",
      icon: "🛡️",
      tagline: "Tests your ideas before you commit hard capital",
      description:
        "Whenever a founder contemplates a major financial move (marketing spend, hiring, new equipment, discounting), ProfitPilot tests the proposal against cash runway, payback periods, and margin sensitivity.",
      bullets: [
        "Classification: Safe (✅), Risky (⚠️), Prohibited (❌)",
        "Suggests safer test budgets (e.g., 'Test ₹5,000 before committing ₹30,000')",
        "Calculates exact impact on days-of-runway and breakeven timeline",
      ],
      mockup: {
        type: "decision",
        input: "Proposal: Spend ₹25,000 on Google Ads this weekend",
        status: "RISKY ⚠️",
        statusColor: "text-amber-400 bg-amber-500/20 border-amber-500/40",
        analysis:
          "Current cash runway is 38 days. A ₹25k outlay reduces runway to 26 days without guaranteed customer payback.",
        recommendation:
          "Recommendation: Allocate ₹4,500 test budget on top-performing SKU keywords first. Review ROAS after 72 hours.",
      },
    },
    {
      id: "health-score",
      title: "2. Real-Time Business Health Score (0-100)",
      short: "Health Scorecard",
      icon: "❤️‍🔥",
      tagline: "One executive score that explains your business vitality",
      description:
        "No more digging through 20 tabs of reports. ProfitPilot synthesizes your cash reserves, gross margins, and expense growth into a single intuitive health score.",
      bullets: [
        "Dynamic score updated continuously from database transactions",
        "Clear breakdown of positive and dragging factors",
        "Automated early alerts (e.g., 'Warning: Marketing burn up 42%')",
      ],
      mockup: {
        type: "score",
        score: "74 / 100",
        grade: "Healthy Stability",
        gradeColor: "text-emerald-400",
        drivers: [
          { label: "Gross Profit Margin", val: "32.4%", status: "Optimal ✅" },
          { label: "Cash Runway", val: "58 Days", status: "Healthy ✅" },
          { label: "Expense Velocity", val: "+14% MoM", status: "Watchlist ⚠️" },
        ],
      },
    },
    {
      id: "sql-agent",
      title: "3. Natural Language SQL Data Engine",
      short: "Live Data Agent",
      icon: "⚡",
      tagline: "Talk directly to your company database in plain English",
      description:
        "Translates plain English questions into safe, optimized PostgreSQL queries. Incorporates schema validation, date resolution, and statistical insights automatically.",
      bullets: [
        "100% read-only safe query generation with parameter validation",
        "Resolves dynamic time windows ('last quarter vs same period last year')",
        "Generates executive takeaways and chart-ready structured output",
      ],
      mockup: {
        type: "sql",
        query: "Which product category drove 70% of refunds this month?",
        sql: "SELECT category, count(*), sum(refund_amount) FROM refunds WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY category ORDER BY sum(refund_amount) DESC LIMIT 3;",
        insight:
          "Category 'Electronics - Wireless Audio' accounts for 68.4% of total refunds due to Bluetooth battery sync complaints.",
      },
    },
    {
      id: "daily-brief",
      title: "4. Daily Executive Action Agenda",
      short: "Daily Agenda",
      icon: "📋",
      tagline: "What to focus on, what to stop, and what to fix first",
      description:
        "Every morning, ProfitPilot delivers a prioritized 3-bullet action brief tailored to your current business state to keep you laser-focused on profit drivers.",
      bullets: [
        "Identifies lagging invoices requiring payment follow-ups",
        "Flags low-stock high-margin SKUs before stockouts happen",
        "Highlights anomalous cost spikes before they compound",
      ],
      mockup: {
        type: "agenda",
        date: "Today's Executive Focus",
        tasks: [
          { tag: "FIX FIRST", text: "Collect ₹42,000 overdue receivables from Client Acme Inc (34 days overdue)." },
          { tag: "STOP", text: "Pause Ad Set #4 (CPA increased by 3.1x over the last 48 hours)." },
          { tag: "GROWTH", text: "Reorder SKU 'Premium Audio Pods' (only 4 days stock remaining)." },
        ],
      },
    },
  ];

  return (
    <section id="solution" className="py-20 bg-[#090D16] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-sm font-bold text-emerald-400">
            ✨ The Proposed Solution
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            An Autonomous AI Co-Founder for{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Every Decision
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            ProfitPilot combines deep financial intelligence, LangGraph agents, and conversational simplicity.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {pillars.map((pillar, idx) => (
            <button
              key={pillar.id}
              onClick={() => setActiveTab(idx)}
              className={`px-6 py-3.5 rounded-2xl text-base font-bold transition-all flex items-center gap-2.5 cursor-pointer border-2 ${
                activeTab === idx
                  ? "bg-emerald-500/20 border-emerald-400 text-white shadow-xl shadow-emerald-950/60"
                  : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <span className="text-xl">{pillar.icon}</span>
              <span>{pillar.short}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Showcase Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-300">
                <span>{pillars[activeTab].icon}</span>
                <span>Pillar 0{activeTab + 1} of 04</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                {pillars[activeTab].title}
              </h3>

              <p className="text-lg text-emerald-400 font-bold">
                {pillars[activeTab].tagline}
              </p>

              <p className="text-base text-slate-300 leading-relaxed font-normal">
                {pillars[activeTab].description}
              </p>

              <div className="space-y-3 pt-2">
                {pillars[activeTab].bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-3 text-base text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0 mt-0.5 font-black">
                      ✓
                    </span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Live Mockup Card */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#030712] border-2 border-slate-800 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono font-bold text-slate-300 ml-1">ProfitPilot Agent Simulation</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    LIVE PREVIEW
                  </span>
                </div>

                {/* Mockup Type 1: Decision */}
                {pillars[activeTab].mockup.type === "decision" && (
                  <div className="space-y-4 text-base">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-200">
                      💬 <span className="text-white font-bold">{pillars[activeTab].mockup.input}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-amber-950/40 border-2 border-amber-500/40">
                      <span className="text-sm text-slate-200 font-bold uppercase">Decision Risk Level</span>
                      <span className={`text-sm px-3 py-1.5 rounded-lg font-black font-mono ${pillars[activeTab].mockup.statusColor}`}>
                        {pillars[activeTab].mockup.status}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
                      {pillars[activeTab].mockup.analysis}
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/40 text-sm text-emerald-200 leading-relaxed font-medium">
                      💡 {pillars[activeTab].mockup.recommendation}
                    </div>
                  </div>
                )}

                {/* Mockup Type 2: Score */}
                {pillars[activeTab].mockup.type === "score" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div>
                        <div className="text-xs text-slate-400 font-mono font-bold">OVERALL HEALTH SCORE</div>
                        <div className="text-4xl font-black text-emerald-400">{pillars[activeTab].mockup.score}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-mono font-bold">STATUS</div>
                        <div className="text-base font-bold text-emerald-300">{pillars[activeTab].mockup.grade}</div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {pillars[activeTab].mockup.drivers?.map((d, dIdx) => (
                        <div key={dIdx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm">
                          <span className="text-slate-200 font-medium">{d.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white text-base">{d.val}</span>
                            <span className="text-slate-400 font-mono text-xs">{d.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mockup Type 3: SQL */}
                {pillars[activeTab].mockup.type === "sql" && (
                  <div className="space-y-3.5 text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-medium">
                      User Query: "{pillars[activeTab].mockup.query}"
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/40 font-mono text-blue-300 text-xs overflow-x-auto">
                      {pillars[activeTab].mockup.sql}
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm leading-relaxed">
                      📊 Insight: {pillars[activeTab].mockup.insight}
                    </div>
                  </div>
                )}

                {/* Mockup Type 4: Agenda */}
                {pillars[activeTab].mockup.type === "agenda" && (
                  <div className="space-y-3 text-sm">
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                      📅 {pillars[activeTab].mockup.date}
                    </div>
                    {pillars[activeTab].mockup.tasks?.map((t, tIdx) => (
                      <div key={tIdx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded font-mono ${
                          t.tag === 'FIX FIRST' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          t.tag === 'STOP' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {t.tag}
                        </span>
                        <p className="text-slate-200 text-sm">{t.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
