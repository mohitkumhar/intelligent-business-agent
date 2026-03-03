import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "../../dashboard/DashboardLayout";

export const Route = createFileRoute("/dashboard/decisions")({
  component: DecisionsPage,
});

type RiskLevel = "Safe" | "Risky" | "Do Not Do";
interface Decision {
  id: number; text: string; type: string;
  risk: RiskLevel; score: number; successProb: number;
  suggestion: string; date: string; status: "Approved" | "Rejected" | "Modified";
}

const decisionsMockData: Decision[] = [
  { id: 1, text: "Spend ₹10,000 on Facebook Ads this month", type: "Marketing", risk: "Risky", score: 42, successProb: 55, suggestion: "Start with ₹3,000 test budget first. Measure ROAS before scaling.", date: "Today", status: "Modified" },
  { id: 2, text: "Hire a new junior developer at ₹18k/month", type: "Hiring", risk: "Safe", score: 80, successProb: 82, suggestion: "Good timing — cash runway is healthy. Use a 3-month probation period.", date: "Yesterday", status: "Approved" },
  { id: 3, text: "Increase premium package price by 40%", type: "Pricing", risk: "Do Not Do", score: 18, successProb: 22, suggestion: "40% is too aggressive. Test with 15% increase first with existing clients.", date: "Oct 24", status: "Rejected" },
  { id: 4, text: "Expand to Delhi NCR market", type: "Expansion", risk: "Risky", score: 55, successProb: 60, suggestion: "Market is viable but expansion costs will reduce cash runway to 60 days. Wait 2 months.", date: "Oct 20", status: "Modified" },
];

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map = {
    "Safe": { bg: "#D1FAE5", color: "#065F46", icon: "✅" },
    "Risky": { bg: "#FEF3C7", color: "#92400E", icon: "⚠️" },
    "Do Not Do": { bg: "#FEE2E2", color: "#991B1B", icon: "❌" },
  };
  const s = map[risk];
  return <span style={{ fontSize: "11px", fontWeight: 700, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: "20px" }}>{s.icon} {risk}</span>;
}

function DecisionsPage() {
  const [range, setRange] = React.useState<"7" | "30" | "90">("30");
  const [showForm, setShowForm] = React.useState(false);
  const [newDecision, setNewDecision] = React.useState({ text: "", type: "Marketing" });
  const [decisions, setDecisions] = React.useState(decisionsMockData);
  const [analyzing, setAnalyzing] = React.useState(false);

  const handleAnalyze = () => {
    if (!newDecision.text.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const random = Math.floor(Math.random() * 3);
      const risks: RiskLevel[] = ["Safe", "Risky", "Do Not Do"];
      const r = risks[random];
      const score = r === "Safe" ? 75 + Math.floor(Math.random() * 20) : r === "Risky" ? 35 + Math.floor(Math.random() * 30) : 10 + Math.floor(Math.random() * 25);
      const newD: Decision = {
        id: Date.now(), text: newDecision.text, type: newDecision.type,
        risk: r, score, successProb: score + 5,
        suggestion: r === "Safe" ? "Good decision. Proceed with a clear action plan."
          : r === "Risky" ? "Proceed carefully. Monitor key metrics weekly."
            : "High risk at current financial state. Reconsider after improving cash flow.",
        date: "Just now", status: r === "Safe" ? "Approved" : r === "Risky" ? "Modified" : "Rejected",
      };
      setDecisions(prev => [newD, ...prev]);
      setNewDecision({ text: "", type: "Marketing" });
      setShowForm(false);
      setAnalyzing(false);
    }, 1800);
  };

  return (
    <DashboardLayout range={range} setRange={setRange} onOpenAdvisor={() => { }} activePage="decisions">
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* Header action */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A2E" }}>Decision Log</div>
            <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>AI-evaluated business decisions</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "7px", background: "linear-gradient(135deg,#6C63FF,#8B5CF6)", color: "white", border: "none", borderRadius: "9px", padding: "9px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Evaluate New Decision
          </button>
        </div>

        {/* New Decision Form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: "14px", border: "2px solid #C7D2FE", padding: "24px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E", marginBottom: "16px" }}>🤖 AI Decision Analysis</div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>DESCRIBE YOUR DECISION</label>
                <input value={newDecision.text} onChange={e => setNewDecision(d => ({ ...d, text: e.target.value }))}
                  placeholder="e.g. Spend ₹50,000 on Google Ads next month"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "9px", border: "1px solid #E5E7EB", fontSize: "13px", color: "#374151", outline: "none", background: "#F9FAFB", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>TYPE</label>
                <select value={newDecision.type} onChange={e => setNewDecision(d => ({ ...d, type: e.target.value }))}
                  style={{ padding: "10px 14px", borderRadius: "9px", border: "1px solid #E5E7EB", fontSize: "13px", color: "#374151", background: "#F9FAFB", cursor: "pointer", outline: "none" }}>
                  {["Marketing", "Hiring", "Pricing", "Expansion"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleAnalyze} disabled={!newDecision.text.trim() || analyzing}
                style={{ flex: 1, padding: "11px", borderRadius: "9px", background: newDecision.text.trim() && !analyzing ? "linear-gradient(135deg,#6C63FF,#8B5CF6)" : "#E5E7EB", color: newDecision.text.trim() && !analyzing ? "white" : "#9CA3AF", border: "none", cursor: newDecision.text.trim() && !analyzing ? "pointer" : "default", fontSize: "13px", fontWeight: 600 }}>
                {analyzing ? "🤖 Analyzing..." : "🔍 Analyze with AI"}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: "11px 20px", borderRadius: "9px", background: "#F3F4F6", color: "#6B7280", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Decision Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {decisions.map(d => (
            <div key={d.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #EBEBF0", padding: "20px", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(108,99,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A2E", marginBottom: "4px" }}>{d.text}</div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#6C63FF", background: "#EEF2FF", padding: "2px 8px", borderRadius: "20px" }}>{d.type}</span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{d.date}</span>
                  </div>
                </div>
                <RiskBadge risk={d.risk} />
              </div>
              <div style={{ padding: "12px", background: "#F9FAFB", borderRadius: "9px", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6C63FF", marginBottom: "4px" }}>💡 AI Suggestion</div>
                <div style={{ fontSize: "12px", color: "#374151", lineHeight: 1.6 }}>{d.suggestion}</div>
              </div>
              <div style={{ display: "flex", gap: "20px" }}>
                {[{ label: "Decision Score", val: `${d.score}/100` }, { label: "Success Probability", val: `${d.successProb}%` }, { label: "Status", val: d.status }].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: m.val === d.status ? (d.status === "Approved" ? "#10B981" : d.status === "Rejected" ? "#EF4444" : "#F59E0B") : "#1A1A2E", marginTop: "2px" }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
