import React, { useState } from "react";

interface FlowInfo {
  id: string;
  title: string;
  badge: string;
  svgFile: string;
  summary: string;
  steps: { name: string; desc: string; tag: string }[];
  keyHighlight: string;
}

export function ArchitectureExplorer() {
  const [activeFlowIndex, setActiveFlowIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const flows: FlowInfo[] = [
    {
      id: "main-graph",
      title: "1. Main LangGraph Multi-Intent Orchestrator",
      badge: "Master LangGraph Router",
      svgFile: "/diagrams/main-graph-flow.svg",
      summary:
        "The central control graph that authenticates incoming user queries, classifies their multi-intent nature using Llama 3.2, routes tasks across specialized subgraphs, and formats a cohesive streaming response.",
      steps: [
        {
          name: "1. authenticate_request",
          desc: "Validates API credentials, user session, and business tenancy before execution.",
          tag: "Security",
        },
        {
          name: "2. intent_detection",
          desc: "ChatOllama (Llama 3.2:3b) classifies queries into 5 intent categories: database analytics, general search, greetings, Loki logs, or Prometheus metrics.",
          tag: "LLM Classification",
        },
        {
          name: "3. Subgraph Dispatching",
          desc: "Executes specialized subgraphs in parallel or sequential pipeline with PostgresSaver state checkpointer.",
          tag: "Routing",
        },
        {
          name: "4. format_response",
          desc: "Synthesizes multi-source facts, visual charts, and executive recommendations into Server-Sent Events (SSE) stream.",
          tag: "Synthesis & SSE",
        },
      ],
      keyHighlight:
        "PostgresSaver memory checkpointing preserves multi-turn conversation context and enables seamless human-in-the-loop interrupts.",
    },
    {
      id: "sql-insight",
      title: "2. SQL Insight & Safe Query Generation Engine",
      badge: "PostgreSQL Analytics Subgraph",
      svgFile: "/diagrams/sql-insight-generation.svg",
      summary:
        "Converts natural language questions into safe, validated read-only SQL queries on the company database, analyzes raw metrics, and generates actionable business recommendations.",
      steps: [
        {
          name: "1. Resolve Data Range",
          desc: "Parses relative date terms like 'last month', 'this Q3', or 'past 14 days' into precise SQL date filters.",
          tag: "Date Parser",
        },
        {
          name: "2. Validate Entities & Interrupt",
          desc: "Verifies referenced tables and columns against live schema. If ambiguous, triggers an interrupt to request human clarification.",
          tag: "HITL Guardrail",
        },
        {
          name: "3. Generate & Validate SQL",
          desc: "Constructs parameterized SELECT queries and validates syntax safety against strict read-only execution rules (loops back on error).",
          tag: "Safe CodeGen",
        },
        {
          name: "4. Execute & Generate Insights",
          desc: "Executes query on PostgreSQL, performs anomaly detection, and transforms numbers into business health recommendations.",
          tag: "Insight Engine",
        },
      ],
      keyHighlight:
        "100% read-only safety with automated validation loop preventing SQL injection, table drops, and runaway execution.",
    },
    {
      id: "general-info",
      title: "3. Live Web Search & Market Context Flow",
      badge: "Real-Time Web Intelligence",
      svgFile: "/diagrams/general-information-graph.svg",
      summary:
        "Determines whether an industry query requires fresh external market data, competitor benchmarking, or macroeconomic indicators via DuckDuckGo live search.",
      steps: [
        {
          name: "1. Check if Web Search is Required",
          desc: "LLM evaluates whether the question requires external real-time data or can be answered directly from internal domain knowledge.",
          tag: "Decision Gate",
        },
        {
          name: "2. Perform DuckDuckGo Search",
          desc: "Executes live web search queries, scrapes relevant snippets, and cleans the text payload.",
          tag: "Live Scraper",
        },
        {
          name: "3. Answer User Query",
          desc: "Synthesizes web findings with company-specific context to provide grounded, hallucination-free answers.",
          tag: "Synthesis",
        },
      ],
      keyHighlight:
        "Dynamic web search trigger ensures zero unnecessary API calls while guaranteeing up-to-date industry benchmarking.",
    },
    {
      id: "metrics-subgraph",
      title: "4. Prometheus Real-Time Telemetry Subgraph",
      badge: "System & API Health Telemetry",
      svgFile: "/diagrams/metrics-sub-graph.svg",
      summary:
        "Queries Prometheus time-series metrics to analyze API request rates, system latency, error frequencies, and server load for technical observability.",
      steps: [
        {
          name: "1. parse_metrics_query",
          desc: "Extracts target metric names (e.g. HTTP throughput, CPU load, memory utilization, P99 latency).",
          tag: "Parser",
        },
        {
          name: "2. fetch_metrics",
          desc: "Executes PromQL queries against Prometheus endpoint at port 9090.",
          tag: "PromQL API",
        },
        {
          name: "3. analyze & format_metrics_response",
          desc: "Computes statistical percentiles, flags technical anomalies, and outputs clear system status summaries.",
          tag: "Observability",
        },
      ],
      keyHighlight:
        "Enables both business owners and technical teams to monitor application health through the same conversational interface.",
    },
    {
      id: "logs-subgraph",
      title: "5. Loki Observability & Audit Log Flow",
      badge: "Loki Log Inspection Subgraph",
      svgFile: "/diagrams/web-search-decision-flow.svg",
      summary:
        "Analyzes raw system logs shipped via Promtail into Grafana Loki, isolating warning patterns, trace errors, and operational audits.",
      steps: [
        {
          name: "1. parse_logs_query",
          desc: "Identifies log labels, severity levels (INFO/WARN/ERROR), and relevant time frames.",
          tag: "LogQL Parser",
        },
        {
          name: "2. fetch_logs",
          desc: "Queries Grafana Loki at port 3100 to stream relevant structured application logs.",
          tag: "Loki API",
        },
        {
          name: "3. analyze & format_logs_response",
          desc: "Performs pattern clustering to explain exact root causes of failures in human-readable terms.",
          tag: "Root Cause AI",
        },
      ],
      keyHighlight:
        "Instant diagnosis of operational errors without needing to manually inspect terminal logs or pgAdmin consoles.",
    },
  ];

  const currentFlow = flows[activeFlowIndex];

  return (
    <section id="architecture" className="py-20 bg-[#0B1120] text-white relative border-t-2 border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-sm font-bold text-blue-400">
            📊 System Flowcharts & Architecture
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            How ProfitPilot Works{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Under the Hood
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-200 font-medium">
            Explore the multi-agent graph flows powering our autonomous business assistant. Built on LangGraph, PostgreSQL, and streaming telemetry.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {flows.map((flow, idx) => (
            <button
              key={flow.id}
              onClick={() => setActiveFlowIndex(idx)}
              className={`px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all flex items-center gap-2.5 cursor-pointer border-2 ${
                activeFlowIndex === idx
                  ? "bg-blue-600/30 border-blue-400 text-white shadow-xl shadow-blue-950 ring-1 ring-blue-400/50"
                  : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>{flow.badge}</span>
            </button>
          ))}
        </div>

        {/* Main Diagram & Explanation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Diagram */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl border-2 border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-base font-mono font-bold text-white">{currentFlow.title}</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Zoom Fullscreen</span>
              </button>
            </div>

            {/* Render SVG */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="bg-white rounded-2xl p-6 flex items-center justify-center min-h-[400px] cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all overflow-hidden group relative"
            >
              <img
                src={currentFlow.svgFile}
                alt={currentFlow.title}
                className="w-full h-auto max-h-[460px] object-contain transition-transform group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-5 py-2.5 rounded-xl bg-slate-900/95 text-white text-sm font-bold shadow-2xl border border-slate-700">
                  🔍 Click to View Fullscreen
                </span>
              </div>
            </div>

            {/* Key Highlight */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border-2 border-blue-500/40 text-sm text-blue-200 flex items-start gap-3">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <span className="font-bold text-blue-100">Engineering Highlight: </span>
                {currentFlow.keyHighlight}
              </div>
            </div>
          </div>

          {/* Right Column: Steps */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {currentFlow.badge}
                </span>
                <h3 className="text-2xl font-black text-white pt-2">{currentFlow.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{currentFlow.summary}</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Node-by-Node Execution Breakdown
                </div>

                <div className="space-y-3">
                  {currentFlow.steps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">{step.name}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                          {step.tag}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-normal">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Fullscreen */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="font-bold text-base text-white">{currentFlow.title}</div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-bold cursor-pointer border border-slate-700"
                >
                  ✕ Close Fullscreen
                </button>
              </div>
              <div className="p-8 bg-white overflow-auto flex items-center justify-center">
                <img
                  src={currentFlow.svgFile}
                  alt={currentFlow.title}
                  className="max-w-full h-auto max-h-[75vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
