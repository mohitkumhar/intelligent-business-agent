import React from "react";

export function ProblemSection() {
  const problems = [
    {
      icon: "🎲",
      badge: "PROBLEM 1",
      title: "Decisions Based on Emotion & Guesswork",
      desc: "Founders spend ₹20,000–₹50,000 on ads, inventory, or hiring based purely on gut feeling without knowing if unit economics support it.",
      consequence: "Money gets wasted and identical mistakes are repeated continuously.",
    },
    {
      icon: "📑",
      badge: "PROBLEM 2",
      title: "Siloed & Fragmented Business Data",
      desc: "Sales in Stripe, expenses in Excel, receipts in WhatsApp, and inventory in notebooks. No unified real-time financial picture.",
      consequence: "Zero visibility into true cash burn and real profit margins.",
    },
    {
      icon: "🚫",
      badge: "PROBLEM 3",
      title: "No System Warns You Before You Act",
      desc: "Traditional accounting tools only show post-mortems (what was already lost). No software proactively shouts 'STOP, this decision will drain cash!'",
      consequence: "82% of small business failures stem directly from cash flow mismanagement.",
    },
  ];

  return (
    <section id="problem" className="py-20 bg-[#0B1120] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/15 border border-red-500/40 text-sm font-bold text-red-400">
            ⚠️ The Core Problem
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            Why 8 Out of 10 Businesses{" "}
            <span className="text-red-400 underline decoration-red-500/50">Run Out of Cash</span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            Founders are forced to make dozens of high-stakes financial choices every week without an advisor by their side.
          </p>
        </div>

        {/* 3 Core Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {problems.map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 hover:border-red-500/50 transition-all shadow-2xl flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl p-4 rounded-2xl bg-slate-800 border border-slate-700">
                    {item.icon}
                  </span>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-300">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                <p className="text-base text-slate-300 leading-relaxed font-normal">{item.desc}</p>
              </div>

              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-sm text-red-300 font-medium">
                <span className="font-bold text-red-400">Fatal Impact: </span>
                {item.consequence}
              </div>
            </div>
          ))}
        </div>

        {/* Contrast Comparison Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950/40 via-slate-900 to-emerald-950/40 border-2 border-slate-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* The Old Broken Way */}
            <div className="space-y-4">
              <div className="text-sm font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                The Old Broken Way (Flying Blind)
              </div>
              <div className="space-y-2.5 text-base sm:text-lg text-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-bold text-xl">✕</span> Make ₹30,000 ad spend based on optimism
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-bold text-xl">✕</span> Discover 30 days later that money produced zero ROI
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-bold text-xl">✕</span> Severe liquidity crisis & payroll emergency
                </div>
              </div>
            </div>

            {/* The ProfitPilot Way */}
            <div className="space-y-4 bg-slate-900/90 p-6 rounded-2xl border-2 border-emerald-500/40">
              <div className="text-sm font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                The ProfitPilot Way (Autonomous Co-Pilot)
              </div>
              <div className="space-y-2.5 text-base sm:text-lg text-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-xl">✓</span> Ask ProfitPilot: "Should I spend ₹30k on ads?"
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-xl">✓</span> AI Warning: "Risky ⚠️. Runway drops from 48 to 26 days. Test ₹5,000 first."
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-xl">✓</span> Founder saves ₹25,000 capital & preserves runway.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
