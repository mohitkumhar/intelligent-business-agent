"use client";
import { useEffect, useState } from "react";
import { api, BusinessInfo } from "@/lib/api";
import { ExportIcon } from "./Icons";

export default function WelcomeBanner() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    api.getBusinessInfo().then(setBusiness).catch(console.error);
  }, []);

  const handleExport = () => {
    const headers = "Txn ID,Date,Description,Category,Type,Amount\n";
    const data = "1001,2026-03-24,Sample Revenue,Sales,CREDIT,500.00\n1002,2026-03-25,Sample Expense,Ops,DEBIT,150.00";
    const blob = new Blob([headers + data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="welcome-banner">
      <div className="welcome-text">
        <h2>Welcome back, {business?.user_name || business?.business_name || "Guest"}!</h2>
        <p>{dateStr}</p>
      </div>
      <div className="welcome-actions">
        <div style={{ position: 'relative' }}>
          <select className="filter-dropdown" style={{ appearance: 'none', paddingRight: '12px' }}>
            <option>This Month</option>
            <option>Last Month</option>
            <option>Year to Date</option>
          </select>
        </div>
        <button className="export-btn" onClick={handleExport}>
          <ExportIcon size={14} /> Export
        </button>
      </div>
    </div>
  );
}
