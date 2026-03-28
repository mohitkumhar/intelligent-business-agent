"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, ChatbotIcon, SparklesIcon, FileUpIcon } from "./Icons";

export default function Sidebar() {
  const pathname = usePathname();

  const mainMenu = [
    { label: "Dashboard", href: "/", icon: <DashboardIcon size={18} /> },
    { label: "Chatbot", href: "/chatbot", icon: <ChatbotIcon size={18} /> },
    { label: "Import Data", href: "/import", icon: <FileUpIcon size={18} /> },
  ];
  console.log("Current mainMenu:", mainMenu.map(m => m.label));

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
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = "http://localhost:3000";
          }}
          className="nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: 'auto', padding: '12px 16px', color: '#64748B', fontWeight: 500 }}
        >
          <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', width: '18px' }}>🚪</span>
          <span>Logout</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="ai-boost-card">
          <div className="ai-icon"><SparklesIcon size={20} color="#3B82F6" /></div>
          <div className="ai-title">Boost with AI</div>
          <div className="ai-desc">
            AI-powered insights tools that save hours.
          </div>
          <button className="ai-boost-btn">Upgrade to Pro</button>
        </div>
      </div>
    </aside>
  );
}
