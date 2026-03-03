import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "../../dashboard/DashboardLayout";

export const Route = createFileRoute("/dashboard/data")({
    component: BusinessDataPage,
});

interface Transaction {
    id: number; date: string; type: "Revenue" | "Expense";
    category: string; amount: number; description: string;
}

const mockTransactions: Transaction[] = [
    { id: 1, date: "2026-03-03", type: "Revenue", category: "Product Sales", amount: 12500, description: "March batch sales" },
    { id: 2, date: "2026-03-02", type: "Expense", category: "Marketing", amount: 3200, description: "Facebook Ads spend" },
    { id: 3, date: "2026-03-01", type: "Revenue", category: "Services", amount: 8000, description: "Consulting retainer" },
    { id: 4, date: "2026-02-28", type: "Expense", category: "Salaries", amount: 45000, description: "Feb payroll" },
    { id: 5, date: "2026-02-27", type: "Expense", category: "Software", amount: 1200, description: "SaaS subscriptions" },
    { id: 6, date: "2026-02-25", type: "Revenue", category: "Product Sales", amount: 6800, description: "Weekend sales" },
];

function BusinessDataPage() {
    const [range, setRange] = React.useState<"7" | "30" | "90">("30");
    const [transactions, setTransactions] = React.useState(mockTransactions);
    const [showAdd, setShowAdd] = React.useState(false);
    const [form, setForm] = React.useState({ date: new Date().toISOString().split("T")[0], type: "Revenue" as "Revenue" | "Expense", category: "Product Sales", amount: "", description: "" });

    const totalRevenue = transactions.filter(t => t.type === "Revenue").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    const categories = {
        Revenue: ["Product Sales", "Services", "Consulting", "Investment", "Other"],
        Expense: ["Salaries", "Marketing", "Software", "Rent", "Utilities", "Inventory", "Other"],
    };

    const handleAdd = () => {
        if (!form.amount || isNaN(Number(form.amount))) return;
        const newT: Transaction = {
            id: Date.now(), date: form.date, type: form.type,
            category: form.category, amount: Number(form.amount), description: form.description,
        };
        setTransactions(prev => [newT, ...prev]);
        setForm({ date: new Date().toISOString().split("T")[0], type: "Revenue", category: "Product Sales", amount: "", description: "" });
        setShowAdd(false);
    };

    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

    return (
        <DashboardLayout range={range} setRange={setRange} onOpenAdvisor={() => { }} activePage="data">
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* Summary Cards */}
                <div style={{ display: "flex", gap: "14px" }}>
                    {[
                        { label: "Total Revenue", val: fmt(totalRevenue), color: "#10B981", bg: "#D1FAE5" },
                        { label: "Total Expenses", val: fmt(totalExpense), color: "#EF4444", bg: "#FEE2E2" },
                        { label: "Net Profit", val: fmt(netProfit), color: netProfit >= 0 ? "#6C63FF" : "#EF4444", bg: "#EEF2FF" },
                    ].map(c => (
                        <div key={c.label} style={{ flex: 1, background: "#fff", borderRadius: "12px", border: "1px solid #EBEBF0", padding: "18px 20px" }}>
                            <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>{c.label}</div>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: c.color }}>{c.val}</div>
                            <div style={{ marginTop: "8px", width: "100%", height: "4px", background: "#F3F4F6", borderRadius: "99px" }}>
                                <div style={{ width: `${Math.min((c.label === "Total Revenue" ? totalRevenue / (totalRevenue + totalExpense) : c.label === "Total Expenses" ? totalExpense / (totalRevenue + totalExpense) : Math.abs(netProfit) / (totalRevenue + 1)) * 100, 100)}%`, height: "4px", background: c.color, borderRadius: "99px" }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transaction Log */}
                <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #EBEBF0", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>Transaction Log</div>
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>All sales and expense entries</div>
                        </div>
                        <button onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#6C63FF,#8B5CF6)", color: "white", border: "none", borderRadius: "9px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Entry
                        </button>
                    </div>

                    {/* Add Form */}
                    {showAdd && (
                        <div style={{ background: "#F8F8FF", border: "1px solid #C7D2FE", borderRadius: "10px", padding: "18px", marginBottom: "20px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#6C63FF", marginBottom: "14px" }}>New Transaction Entry</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "5px" }}>DATE</label>
                                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", outline: "none", boxSizing: "border-box", background: "#fff" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "5px" }}>TYPE</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any, category: categories[e.target.value as "Revenue" | "Expense"][0] }))}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", outline: "none", boxSizing: "border-box", background: "#fff", cursor: "pointer" }}>
                                        <option>Revenue</option><option>Expense</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "5px" }}>CATEGORY</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", outline: "none", boxSizing: "border-box", background: "#fff", cursor: "pointer" }}>
                                        {categories[form.type].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "5px" }}>AMOUNT (₹)</label>
                                    <input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", outline: "none", boxSizing: "border-box", background: "#fff" }} />
                                </div>
                                <div style={{ gridColumn: "2 / 4" }}>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "5px" }}>DESCRIPTION</label>
                                    <input placeholder="Brief note about the transaction" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", outline: "none", boxSizing: "border-box", background: "#fff" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={handleAdd} style={{ flex: 1, padding: "10px", borderRadius: "9px", background: "linear-gradient(135deg,#6C63FF,#8B5CF6)", color: "white", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Save Entry</button>
                                <button onClick={() => setShowAdd(false)} style={{ padding: "10px 18px", borderRadius: "9px", background: "#F3F4F6", color: "#6B7280", border: "none", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                                {["DATE", "TYPE", "CATEGORY", "AMOUNT", "DESCRIPTION"].map(h => (
                                    <th key={h} style={{ textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", padding: "8px", letterSpacing: "0.5px" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "10px 8px", fontSize: "12px", color: "#6B7280" }}>{t.date}</td>
                                    <td style={{ padding: "10px 8px" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: t.type === "Revenue" ? "#10B981" : "#EF4444", background: t.type === "Revenue" ? "#D1FAE5" : "#FEE2E2", padding: "2px 8px", borderRadius: "20px" }}>{t.type}</span>
                                    </td>
                                    <td style={{ padding: "10px 8px", fontSize: "12px", color: "#374151" }}>{t.category}</td>
                                    <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: 700, color: t.type === "Revenue" ? "#10B981" : "#EF4444" }}>{fmt(t.amount)}</td>
                                    <td style={{ padding: "10px 8px", fontSize: "12px", color: "#6B7280" }}>{t.description || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
