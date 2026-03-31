"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, ChatbotIcon, SparklesIcon, ReceiptIcon, PackageIcon, UsersIcon, AlertTriangleIcon } from "./Icons";



export default function Sidebar() {
  const pathname = usePathname();

  const dashboardMenu = [
    { label: "Overview", href: "/", icon: <DashboardIcon size={18} /> },
    { label: "AI Chatbot", href: "/chatbot", icon: <ChatbotIcon size={18} /> },
  ];

  const businessMenu = [
    { label: "Transactions", href: "/transactions", icon: <ReceiptIcon size={18} /> },
    { label: "Inventory", href: "/inventory", icon: <PackageIcon size={18} /> },
    { label: "Staff", href: "/staff", icon: <UsersIcon size={18} /> },
    { label: "Alerts", href: "/alerts", icon: <AlertTriangleIcon size={18} /> },
  ];


  const systemMenu = [
    { label: "Profile", href: "/profile", icon: <SparklesIcon size={18} /> },
    { label: "Settings", href: "/settings", icon: <DashboardIcon size={18} /> },
  ];


  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon"></div>
        <span className="logo-text">ProfitPilot</span>
      </div>

      {/* Management Section */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Management</div>
        </div>
        {dashboardMenu.map((item) => (
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

      {/* Business Section */}
      <nav className="sidebar-nav" style={{ marginTop: "16px" }}>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Business</div>
        </div>
        {businessMenu.map((item) => (
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

      {/* System Section */}
      <nav className="sidebar-nav" style={{ marginTop: "16px" }}>
        <div className="sidebar-section">
          <div className="sidebar-section-title">System</div>
        </div>
        {systemMenu.map((item) => (
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


    </aside>
  );
}
