"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, ChatbotIcon, SparklesIcon } from "./Icons";

export default function Sidebar() {
  const pathname = usePathname();

  const mainMenu = [
    { label: "Dashboard", href: "/", icon: <DashboardIcon size={18} /> },
    { label: "Chatbot", href: "/chatbot", icon: <ChatbotIcon size={18} /> },
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
