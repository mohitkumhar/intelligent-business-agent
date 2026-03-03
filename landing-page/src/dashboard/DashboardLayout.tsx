import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ThemeProvider, useTheme, themeVars } from "./ThemeContext";

type DateRange = "7" | "30" | "90";

interface DashboardLayoutProps {
    children?: React.ReactNode;
    range: DateRange;
    setRange: (r: DateRange) => void;
    onOpenAdvisor: () => void;
    activePage?: string;
}

const navItems = [
    { id: "overview", label: "Dashboard", href: "/dashboard", icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: "business-health", label: "Business Health", href: "/dashboard/business-health", icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
    { id: "data", label: "Business Data", href: "/dashboard/data", icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: "decisions", label: "Decisions", href: "/dashboard/decisions", icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { id: "alerts", label: "Alerts", href: "/dashboard", icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: "advisor", label: "Chat Advisor", href: "#", isAdvisor: true, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
];

const dateOptions: { label: string; value: DateRange }[] = [
    { label: "Last 7 Days", value: "7" },
    { label: "Last 30 Days", value: "30" },
    { label: "Last 90 Days", value: "90" },
];

// ─── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const t = themeVars[theme];
    return (
        <button
            onClick={toggle}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            style={{
                width: "38px",
                height: "38px",
                borderRadius: "9px",
                background: t.btnSecBg,
                border: `1px solid ${t.border}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6C63FF"; e.currentTarget.style.background = theme === "dark" ? "#1C1C1C" : "#EEF2FF"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.btnSecBg; }}
        >
            {theme === "light" ? (
                /* Moon icon */
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6C63FF" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            ) : (
                /* Sun icon */
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
            )}
        </button>
    );
}

// ─── Inner Layout (consumes theme) ─────────────────────────────────────────────
function Inner({ children, range, setRange, onOpenAdvisor, activePage }: DashboardLayoutProps) {
    const { theme } = useTheme();
    const t = themeVars[theme];

    const currentPath = useRouterState({ select: s => s.location.pathname });
    const [dateDropOpen, setDateDropOpen] = React.useState(false);
    const dateRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const h = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateDropOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const getBreadcrumb = () => {
        if (currentPath.includes("business-health")) return "Business Health";
        if (currentPath.includes("data")) return "Business Data";
        if (currentPath.includes("decisions")) return "Decisions";
        return "Overview";
    };

    return (
        <div style={{ display: "flex", height: "100vh", width: "100%", background: t.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: "hidden", transition: "background 0.3s, color 0.3s" }}>

            {/* ── Sidebar ─────────────────── */}
            <aside style={{ width: "220px", flexShrink: 0, background: t.sidebarBg, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", height: "100%", transition: "background 0.3s" }}>

                {/* Logo */}
                <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#6C63FF,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: t.text, letterSpacing: "-0.3px" }}>Vaith Coders</span>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
                    {navItems.map(item => {
                        const isActive = activePage ? item.id === activePage : currentPath === item.href;

                        if (item.isAdvisor) {
                            return (
                                <button key={item.id} onClick={onOpenAdvisor}
                                    style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: t.textSub, background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.color = t.text; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textSub; }}
                                >
                                    <span style={{ color: t.textMuted }}>{item.icon}</span>{item.label}
                                </button>
                            );
                        }

                        return (
                            <Link key={item.id} to={item.href as any}
                                style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: isActive ? 600 : 500, color: isActive ? "#6C63FF" : t.textSub, background: isActive ? (theme === "dark" ? "#1C1C1C" : "#EEF2FF") : "transparent", textDecoration: "none", transition: "all 0.15s" }}
                                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = t.surfaceHover; (e.currentTarget as HTMLElement).style.color = t.text; } }}
                                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = t.textSub; } }}
                            >
                                <span style={{ color: isActive ? "#6C63FF" : t.textMuted }}>{item.icon}</span>{item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings */}
                <div style={{ padding: "4px 10px 8px" }}>
                    <a href="#"
                        style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: t.textSub, textDecoration: "none", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textSub; }}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={t.textMuted} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </a>
                </div>

                {/* User */}
                <div style={{ padding: "12px 14px", borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6C63FF,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>AE</div>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: t.text }}>Alex Evans</div>
                        <div style={{ fontSize: "11px", color: t.textMuted }}>Founder</div>
                    </div>
                </div>
            </aside>

            {/* ── Main ─────────────────────── */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Topbar */}
                <div style={{ height: "58px", background: t.headerBg, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, transition: "background 0.3s" }}>
                    {/* Breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: t.textMuted }}>
                        <span>Dashboard</span>
                        <span style={{ fontSize: "16px" }}>›</span>
                        <span style={{ color: t.text, fontWeight: 600 }}>{getBreadcrumb()}</span>
                    </div>

                    {/* Right controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {/* Date Range */}
                        <div ref={dateRef} style={{ position: "relative" }}>
                            <button onClick={() => setDateDropOpen(o => !o)}
                                style={{ display: "flex", alignItems: "center", gap: "6px", background: t.btnSecBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", color: t.btnSecColor, cursor: "pointer", fontWeight: 500 }}>
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={t.textMuted} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {dateOptions.find(o => o.value === range)?.label}
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: dateDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {dateDropOpen && (
                                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "4px", zIndex: 30, boxShadow: theme === "dark" ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.10)", minWidth: "145px" }}>
                                    {dateOptions.map(opt => (
                                        <button key={opt.value} onClick={() => { setRange(opt.value); setDateDropOpen(false); }}
                                            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "12px", borderRadius: "7px", border: "none", cursor: "pointer", fontWeight: opt.value === range ? 600 : 400, color: opt.value === range ? "#6C63FF" : t.text, background: opt.value === range ? (theme === "dark" ? "#1C1C1C" : "#EEF2FF") : "transparent" }}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Consult AI Advisor */}
                        <button onClick={onOpenAdvisor}
                            style={{ display: "flex", alignItems: "center", gap: "7px", background: "linear-gradient(135deg,#6C63FF,#8B5CF6)", color: "white", border: "none", borderRadius: "8px", padding: "7px 15px", fontSize: "12px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(108,99,255,0.35)", transition: "opacity 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                        >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            Consult AI Advisor
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px 32px" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

// ─── Public Export (wraps with ThemeProvider) ─────────────────────────────────
export function DashboardLayout(props: DashboardLayoutProps) {
    return (
        <ThemeProvider>
            <Inner {...props} />
        </ThemeProvider>
    );
}
