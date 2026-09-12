import React from "react";

export function TechStackMatrix() {
  const comparisons = [
    {
      feature: "Pre-Decision Risk Simulation",
      traditionalBI: "❌ No (Historical Only)",
      chatgpt: "❌ Generic Advice Only",
      profitPilot: "✅ Instant Risk Check & Test Budgets",
    },
    {
      feature: "Live SQL DB Integration",
      traditionalBI: "⚠️ Requires SQL Engineers",
      chatgpt: "❌ No Live Database Access",
      profitPilot: "✅ Natural Language to Safe SQL",
    },
    {
      feature: "Proactive Automated Warnings",
      traditionalBI: "❌ Static Charts Only",
      chatgpt: "❌ Passive (User Must Ask)",
      profitPilot: "✅ Automated Runway & Burn Alarms",
    },
    {
      feature: "Agentic Multi-Intent Routing",
      traditionalBI: "❌ None",
      chatgpt: "❌ Single Generic LLM Prompt",
      profitPilot: "✅ LangGraph 5-Subgraph Engine",
    },
    {
      feature: "Full System Telemetry & Logs",
      traditionalBI: "❌ None",
      chatgpt: "❌ None",
      profitPilot: "✅ Prometheus Metrics & Loki Logs",
    },
  ];

  const techStack = [
    {
      category: "Agentic Orchestration",
      tech: "LangGraph + Python 3.11",
      detail: "Stateful graph checkpoints, multi-intent routing, and human-in-the-loop validation.",
      badge: "AI Core",
      color: "border-blue-500/50 bg-blue-950/40 text-blue-300",
    },
    {
      category: "Local LLM Inference",
      tech: "Ollama (Llama 3.2:3b)",
      detail: "High-speed structured output generation for intent detection and insight synthesis.",
      badge: "LLM Engine",
      color: "border-purple-500/50 bg-purple-950/40 text-purple-300",
    },
    {
      category: "Database & Memory",
      tech: "PostgreSQL 16 + PostgresSaver",
      detail: "Relational company data lake and conversational state persistence across chat turns.",
      badge: "Storage",
      color: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300",
    },
    {
      category: "Observability Telemetry",
      tech: "Prometheus + Grafana Loki",
      detail: "PromQL metric scraping on port 9090 and LogQL log monitoring on port 3100.",
      badge: "Monitoring",
      color: "border-orange-500/50 bg-orange-950/40 text-orange-300",
    },
    {
      category: "Streaming API Server",
      tech: "Flask + SSE Streaming",
      detail: "Real-time chunked response generation with token streaming for instant feedback.",
      badge: "API Server",
      color: "border-cyan-500/50 bg-cyan-950/40 text-cyan-300",
    },
    {
      category: "Frontend Experience",
      tech: "React 19 + TanStack + Tailwind 4",
      detail: "Type-safe routing, ultra-responsive UI, interactive chart widgets, and high-contrast styling.",
      badge: "Web App",
      color: "border-amber-500/50 bg-amber-950/40 text-amber-300",
    },
  ];

  return (
    <section id="tech-stack" className="py-20 bg-[#090D16] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-sm font-bold text-purple-400">
            ⚡ Technology & Competitive Advantage
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            Why ProfitPilot{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              Wins the Hackathon
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            A battle-tested architecture designed for enterprise-grade speed, privacy, and zero hallucination risk.
          </p>
        </div>

        {/* Competitive Comparison Table */}
        <div className="mb-16 p-8 sm:p-10 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-mono text-purple-400 font-bold uppercase">Competitive Landscape</span>
              <h3 className="text-2xl font-bold text-white">How ProfitPilot Compares</h3>
            </div>
            <span className="text-xs px-3.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
              Autonomous AI Co-Pilot
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs sm:text-sm">
                  <th className="py-4 px-4 font-bold">Capability</th>
                  <th className="py-4 px-4 font-bold">Traditional BI (PowerBI)</th>
                  <th className="py-4 px-4 font-bold">Generic LLM (ChatGPT)</th>
                  <th className="py-4 px-4 text-emerald-400 font-black bg-emerald-950/30 rounded-t-xl">ProfitPilot Co-Pilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {comparisons.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-100">{row.feature}</td>
                    <td className="py-4 px-4 text-slate-400">{row.traditionalBI}</td>
                    <td className="py-4 px-4 text-slate-400">{row.chatgpt}</td>
                    <td className="py-4 px-4 text-emerald-300 font-black bg-emerald-950/30">
                      {row.profitPilot}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((item, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-slate-950 border-2 border-slate-800 hover:border-purple-500/50 transition-all shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">{item.category}</span>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.color}`}>
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white">{item.tech}</h4>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
