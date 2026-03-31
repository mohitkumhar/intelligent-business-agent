"use client";
import { useState } from "react";
import { SearchIcon, HelpCircleIcon, BellIcon } from "./Icons";

interface TopbarProps {
  onSearch?: (query: string) => void;
}

export default function Topbar({ onSearch }: TopbarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch?.(val);
  };

  const handleExport = () => {
    // Generate a simple CSV content from mock-like headers
    const headers = ["Txn ID,Date,Description,Category,Type,Amount"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">Overview</span>
        <div className="search-box">
          <span className="search-icon"><SearchIcon size={15} color="#94A3B8" /></span>
          <input
            type="text"
            placeholder="Search orders, products, or customers..."
            value={query}
            onChange={handleChange}
          />
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
            ⌘K
          </span>
        </div>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Help">
          <HelpCircleIcon size={16} />
        </button>
        <button className="topbar-icon-btn" title="Notifications">
          <BellIcon size={16} />
        </button>
        <div className="avatar">U</div>
      </div>
    </header>
  );
}
