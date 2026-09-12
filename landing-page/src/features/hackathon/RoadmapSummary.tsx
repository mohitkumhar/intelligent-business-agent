import React from "react";

export function RoadmapSummary({
  onTryDemo,
}: {
  onTryDemo: () => void;
}) {
  const milestones = [
    {
      phase: "Phase 1 (Delivered 🏆)",
      title: "Core Agentic Engine & Risk Simulator",
      desc: "LangGraph 5-intent orchestrator, PostgreSQL safe query validation, business health score, and risk simulator.",
      badge: "LIVE NOW",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    },
    {
      phase: "Phase 2 (In Progress 🚀)",
      title: "WhatsApp & Telegram Voice Co-Pilot",
      desc: "Voice note queries directly from business owners on the go. Daily WhatsApp morning brief & audio summaries.",
      badge: "Q3 2026",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    },
    {
      phase: "Phase 3 (Next Up 🔮)",
      title: "Direct Open Banking & Accounting Sync",
      desc: "Zero-friction bank webhook sync with automated GST reconciliation and auto-invoice follow-up agents.",
      badge: "Q4 2026",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    },
  ];

  return (
    <section className="py-20 bg-[#0B1120] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-sm font-bold text-cyan-400">
            🗺️ Hackathon Roadmap & Vision
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            The Future of{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Autonomous Business
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            From single-founder shops to high-growth SMBs, ProfitPilot is the proactive operating system for capital allocation.
          </p>
        </div>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {milestones.map((item, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-4 flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-slate-400">{item.phase}</span>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Final Pitch Card for Hackathon Judges */}
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-orange-950/60 via-slate-900 to-purple-950/60 border-2 border-orange-500/40 shadow-2xl text-center space-y-7 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/50 text-sm font-black text-orange-300 font-mono">
            🏆 SUMMARY FOR HACKATHON JUDGES
          </div>

          <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            "Not Just Another Chatbot. A Real AI Co-Founder."
          </h3>

          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium">
            ProfitPilot does not wait for founders to fail. It understands the underlying financial numbers, warns them of impending liquidity crunches, and guides every capital allocation before money is spent.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-5">
            <button
              onClick={onTryDemo}
              className="px-9 py-4.5 rounded-2xl font-black text-base bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-orange-500/30 transition-all transform hover:-translate-y-1 cursor-pointer flex items-center gap-2.5"
            >
              <span>🚀 Launch Decision Simulator</span>
              <span>→</span>
            </button>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4.5 rounded-2xl font-bold text-base bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-white transition-all cursor-pointer flex items-center gap-2"
            >
              <span>📊 Open Next.js Dashboard (:3001)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
