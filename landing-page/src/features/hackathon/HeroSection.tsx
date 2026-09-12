import React, { useState } from "react";

export function HeroSection({
  onTryDemo,
  onExploreArchitecture,
}: {
  onTryDemo: (query?: string) => void;
  onExploreArchitecture: () => void;
}) {
  const [activePrompt, setActivePrompt] = useState("");

  const samplePrompts = [
    "Should I spend ₹25,000 on Meta Ads this week?",
    "Can we afford to hire 2 Full-time Sales Execs?",
    "Reorder 1,000 units of top-selling SKU-A?",
    "Check our cash runway & burn rate today",
  ];

  const handlePromptClick = (prompt: string) => {
    setActivePrompt(prompt);
    onTryDemo(prompt);
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-20 md:pt-28 md:pb-28 bg-[#090D16] text-white">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-tr from-orange-600/25 via-purple-600/20 to-blue-600/25 blur-[140px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hackathon Header Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 text-sm font-bold text-orange-300 backdrop-blur-md shadow-lg">
            <span className="flex h-2.5 w-2.5 rounded-full bg-orange-400 animate-pulse" />
            🏆 Hackathon Presentation Showcase
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950/80 border border-blue-500/40 text-sm font-bold text-blue-300 backdrop-blur-md">
            <span>⚡ LangGraph + Llama 3.2 Agent</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-sm font-bold text-emerald-300 backdrop-blur-md">
            <span>🛡️ Pre-Decision Risk Guardrail</span>
          </div>
        </div>

        {/* Hero Title & Pitch */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.12]">
            The AI Co-Founder That{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent underline decoration-orange-500/50 decoration-wavy decoration-2">
              Protects Your Cash
            </span>{" "}
            Before You Act.
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-slate-200 font-medium leading-relaxed max-w-3xl mx-auto">
            Stop making blind business decisions. <span className="text-orange-400 font-bold">ProfitPilot</span> audits your real financial data, simulates risk, and warns you <span className="underline decoration-orange-400">before</span> you spend.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
            <button
              onClick={() => onTryDemo()}
              className="px-9 py-4.5 rounded-2xl font-black text-lg bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:from-orange-400 hover:to-yellow-300 text-slate-950 shadow-xl shadow-orange-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center gap-3"
            >
              <span>🚀 Test Live Decision Simulator</span>
              <span className="text-xl font-bold">→</span>
            </button>

            <button
              onClick={onExploreArchitecture}
              className="px-8 py-4.5 rounded-2xl font-bold text-lg bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-slate-500 text-white backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <span>📊 View System Flowcharts</span>
            </button>
          </div>
        </div>

        {/* Interactive Prompt Sandbox */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="p-1 rounded-3xl bg-gradient-to-r from-orange-500/40 via-purple-500/30 to-blue-500/40 shadow-2xl backdrop-blur-2xl">
            <div className="bg-[#0b1222]/95 rounded-[22px] p-6 sm:p-8 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-mono font-bold text-slate-200 ml-2">Live Agent Sandbox // Instant Decision Test</span>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono font-bold">
                  Click to simulate ↓
                </span>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt)}
                    className={`text-left p-4 rounded-xl border-2 text-base transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      activePrompt === prompt
                        ? "bg-orange-500/20 border-orange-400 text-white font-bold shadow-md"
                        : "bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-orange-500/50 hover:text-white font-medium"
                    }`}
                  >
                    <span className="flex-1">💬 "{prompt}"</span>
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-orange-300 font-mono font-bold shrink-0">
                      Run →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Value Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
          <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-slate-800 text-center space-y-2">
            <div className="text-4xl font-black text-orange-400">90% Faster</div>
            <div className="text-lg font-bold text-white">Decision Velocity</div>
            <div className="text-sm text-slate-300">Simulate financial risk in seconds instead of waiting for monthly books.</div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-slate-800 text-center space-y-2">
            <div className="text-4xl font-black text-amber-400">0% Guesswork</div>
            <div className="text-lg font-bold text-white">Pre-Action Guardrail</div>
            <div className="text-sm text-slate-300">Flags dangerous cash bleed before money ever leaves your bank.</div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-slate-800 text-center space-y-2">
            <div className="text-4xl font-black text-cyan-400">360° Vision</div>
            <div className="text-lg font-bold text-white">Multi-Agent Intelligence</div>
            <div className="text-sm text-slate-300">Live PostgreSQL analytics + Web market data + System telemetry.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
