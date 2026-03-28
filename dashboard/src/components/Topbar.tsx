"use client";
import { SearchIcon, HelpCircleIcon, BellIcon } from "./Icons";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">Overview</span>
        <div className="search-box">
          <span className="search-icon"><SearchIcon size={15} color="#94A3B8" /></span>
          <input type="text" placeholder="Search orders, products, or customers..." />
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
