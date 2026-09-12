# ⚡ ProfitPilot — Autonomous AI Business Co-Pilot

> **"Not just another chatbot. An AI business partner that thinks before you act and protects your cash from fatal decisions."**

---

## 🏆 1. Executive Summary & Pitch

**ProfitPilot** is an autonomous AI business partner built for **small-to-mid-level company founders, local retailers, and D2C brands**. 

Most small business owners make high-stakes financial decisions (marketing ad budgets, hiring employees, inventory reorders, pricing discounts) based on **gut feel, emotion, and fragmented spreadsheets**. Traditional BI tools and accounting software only provide **post-mortems** (telling you why you lost money *after* the cash is already gone).

**ProfitPilot inverts this paradigm:**
- It unifies company database transactions, expenses, and operational data.
- It provides a **Pre-Decision Risk Guardrail** that evaluates capital decisions **before** money leaves the bank account.
- It tags proposals as **Safe (✅)**, **Risky (⚠️)**, or **Prohibited (❌)** and offers concrete, actionable counter-proposals (e.g., *"Test with ₹5,000 on micro-influencers first before committing ₹30,000"*).
- It computes a dynamic **Business Health Score (0–100)** with real-time cash runway forecasting and automated early warning alerts.

---

## ⚠️ 2. The Problem Statement (Why 82% of Small Businesses Fail)

| # | Pain Point | Real-World Impact |
|---|---|---|
| **1** | **Decisions Based on Emotion & Guesswork** | Founders spend ₹20k–₹50k on ads or staff without knowing if current unit economics support it. |
| **2** | **Fragmented & Siloed Business Data** | Sales in payment gateways, expenses in Excel sheets, receipts in WhatsApp, and inventory in notebooks. |
| **3** | **Zero Pre-Decision Warning System** | Existing tools show historical graphs only; no system proactively says *"STOP, this decision will drain cash in 30 days!"* |
| **4** | **Sudden Insolvency & Capital Bleed** | Founders discover cash-flow crunches when it is already too late to recover. |

---

## 🛡️ 3. The Solution: 4 Core Pillars

### 1. 🛡️ Pre-Decision Risk Simulator
Whenever a founder contemplates a major financial move, ProfitPilot tests the proposal against live cash runway, historical payback periods, and margin sensitivity.
- **Verdict Levels:** Safe (✅), Risky (⚠️), Prohibited (❌).
- **Runway Stress-Testing:** Simulates exact runway impact (e.g., *48 days ➔ 28 days*).
- **Counter-Proposals:** Suggests safer test budgets and milestone checkpoints.

### 2. ❤️‍🔥 Real-Time Business Health Score (0–100)
A single executive metric that synthesizes:
- **Cash Runway (Days of Survival)**
- **Monthly Net Burn Velocity**
- **Gross Profit Margin vs Industry Average**
- **CAC to LTV Payback Efficiency**

### 3. ⚡ Natural Language to Safe SQL Data Engine
Enables non-technical founders to ask questions in plain English (*"Which product category drove 70% of refunds this month?"*).
- Translates natural language into **100% read-only, parameterized PostgreSQL queries**.
- Includes dynamic date parsers (*"last quarter vs Q3 last year"*) and schema validation loops.
- Employs **Human-in-the-Loop (HITL) interrupts** to ask for clarification if entity references are ambiguous.

### 4. 📋 Daily Executive Action Agenda
Every morning, ProfitPilot delivers a prioritized 3-bullet action plan:
- **FIX FIRST:** Immediate high-priority recovery (e.g., overdue invoices).
- **STOP:** Active cost leaks (e.g., pausing ad campaigns with spiked CPAs).
- **GROWTH:** High-margin revenue opportunities (e.g., restocking fast-moving SKUs before stockouts).

---

## 📊 4. System Architecture & Multi-Agent Workflows

ProfitPilot is powered by a **multi-agent graph architecture** built with **LangGraph, Python 3.11, PostgreSQL, Ollama (Llama 3.2), Prometheus, and Grafana Loki**.

```
                           [ User Query via Web / WhatsApp ]
                                          │
                                          ▼
                                ┌───────────────────┐
                                │ authenticate_user │
                                └─────────┬─────────┘
                                          │
                                          ▼
                                ┌───────────────────┐
                                │ intent_detection  │  (Llama 3.2 / Ollama)
                                └─────────┬─────────┘
                                          │
         ┌──────────────────┬─────────────┼──────────────┬──────────────────┐
         ▼                  ▼             ▼              ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────┐ ┌───────────────┐ ┌────────────────┐
│ database_request│ │ general_info │ │greeting │ │ metrices_req  │ │ logs_request   │
│ (PostgreSQL &   │ │ (DuckDuckGo  │ │ (Direct │ │ (Prometheus   │ │ (Grafana Loki  │
│  SQL Generator) │ │  Live Web)   │ │  Chat)  │ │  PromQL API)  │ │  LogQL API)    │
└────────┬────────┘ └──────┬───────┘ └────┬────┘ └───────┬───────┘ └────────┬───────┘
         │                 │              │              │                  │
         └──────────────────┴─────────────┼──────────────┴──────────────────┘
                                          │
                                          ▼
                                ┌───────────────────┐
                                │  format_response  │  (Synthesis & SSE Stream)
                                └─────────┬─────────┘
                                          │
                                          ▼
                               [ Real-time SSE Stream ]
```

### The 5 Graph Workflows:
1. **Master Intent Orchestrator (`main-graph-flow.svg`):** Authenticates sessions, detects multi-intent queries, routes tasks across subgraphs, and formats streaming responses.
2. **SQL Insight Subgraph (`sql-insight-generation.svg`):** Date resolution ➔ Entity validation & HITL interrupt ➔ Schema fetching ➔ Safe SQL generation & validation loop ➔ Query execution ➔ Business insight generation.
3. **Live Web Intelligence Subgraph (`general-information-graph.svg`):** Evaluates if real-time market data is required ➔ Executes DuckDuckGo web scraping ➔ Synthesizes market benchmarks.
4. **Prometheus Telemetry Subgraph (`metrics-sub-graph.svg`):** PromQL querying for server load, API throughput, and response latency.
5. **Loki Observability Subgraph (`web-search-decision-flow.svg`):** LogQL pattern analysis for error tracing and operational audits.

---

## ⚔️ 5. Competitive Edge & Differentiation

| Capability | Traditional BI (PowerBI / Tableau) | Generic LLMs (ChatGPT / Claude) | ProfitPilot AI Co-Pilot |
|---|---|---|---|
| **Pre-Decision Risk Simulation** | ❌ No (Historical analysis only) | ❌ Generic advice only | **✅ Real-time risk scoring & counter-budgets** |
| **Live Database Integration** | ⚠️ Requires dedicated SQL engineers | ❌ No live database access | **✅ Natural language to safe PostgreSQL queries** |
| **Proactive Early Warnings** | ❌ Passive static dashboards | ❌ Passive (Only responds when asked) | **✅ Automated cash runway & burn alarms** |
| **Agentic Multi-Intent Routing** | ❌ None | ❌ Single generic prompt | **✅ LangGraph 5-subgraph orchestration** |
| **Full Technical Observability** | ❌ None | ❌ None | **✅ Prometheus telemetry & Loki logs** |
| **Designed for Non-Technical Founders** | ❌ Steep learning curve | ⚠️ Hallucination risk on company facts | **✅ Simple conversational interface & clear advice** |

---

## 🛠️ 6. Technology Stack

- **AI Orchestration & Agents:** LangGraph, Python 3.11, PostgresSaver Checkpointing
- **LLM Inference:** Ollama (`llama3.2:3b`), Structured Output Detection
- **Database & Storage:** PostgreSQL 16, Parameterized Read-Only Execution
- **Streaming API Backend:** Python Flask, Server-Sent Events (SSE)
- **Frontend & Landing Showcase:** React 19, TanStack Router, Vite, Tailwind CSS 4, Motion
- **Observability & Monitoring:** Prometheus (Port 9090), Grafana Loki (Port 3100), Promtail

---

## 🗺️ 7. Project Roadmap

- **Phase 1 (Delivered 🏆):** LangGraph multi-intent engine, PostgreSQL safe analytics, pre-decision risk simulator, and business health scorecard.
- **Phase 2 (In Progress 🚀):** WhatsApp & Telegram Voice Co-Pilot for voice-note decision checking and automated daily morning audio briefs.
- **Phase 3 (Next Up 🔮):** Direct Open Banking webhook integration, automated GST reconciliation, and auto-invoice follow-up agents.

---

## 🚀 8. Quick Start Guide

### 1. Start the Flask Backend (Port 5000)
```bash
# In workspace root
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python agent_code/app.py
```

### 2. Start the Showcase Landing Page (Port 3003)
```bash
cd landing-page
npm install
npm run dev
# Open http://localhost:3003
```

### 3. Start the Next.js Analytics Dashboard (Port 3001)
```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3001
```

---

## 🎯 9. Key Hackathon Takeaway

> **"ProfitPilot doesn't wait for businesses to fail. It understands the numbers, stress-tests decisions in advance, and gives founders the confidence to grow without fear of cash exhaustion."**
