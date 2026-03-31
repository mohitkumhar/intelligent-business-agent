"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANDING_PAGE_URL } from "@/lib/publicUrls";
import { DashboardIcon, ChatbotIcon, FileUpIcon, UsersIcon } from "./Icons";

function clearProfitPilotSession() {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("profit_pilot")) localStorage.removeItem(key);
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  const mainMenu = [
    { label: "Dashboard", href: "/", icon: <DashboardIcon size={18} /> },
    { label: "Chatbot", href: "/chatbot", icon: <ChatbotIcon size={18} /> },
    { label: "Import Data", href: "/import", icon: <FileUpIcon size={18} /> },
  ];
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon"></div>
        <span className="logo-text">ProfitPilot</span>
      </div>

      {/* Main Menu */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main Menu</div>
        </div>
        {mainMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Account Section */}
      <nav className="sidebar-nav" style={{ marginTop: 'auto' }}>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Account</div>
        </div>
        <Link
          href="/profile"
          className={`nav-link ${pathname === "/profile" ? "active" : ""}`}
        >
          <span className="nav-icon">
            <UsersIcon size={18} />
          </span>
          <span>Profile</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            clearProfitPilotSession();
            window.location.href = LANDING_PAGE_URL.replace(/\/$/, "");
          }}
          className="nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: 'auto', padding: '12px 16px', color: '#64748B', fontWeight: 500 }}
        >
          <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', width: '18px' }}>🚪</span>
          <span>Logout</span>
        </button>
      </nav>

      {/* Sidebar footer removed as requested */}
    </aside>
  );
}
