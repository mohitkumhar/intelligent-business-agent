import * as React from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
    theme: "light",
    toggle: () => { },
});

export function useTheme() {
    return React.useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = React.useState<Theme>(() => {
        try {
            return (localStorage.getItem("dashboard-theme") as Theme) ?? "dark";
        } catch {
            return "dark";
        }
    });

    const toggle = () => {
        setTheme((t) => {
            const next = t === "light" ? "dark" : "light";
            try { localStorage.setItem("dashboard-theme", next); } catch { }
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

// ─── CSS variable maps ─────────────────────────────────────────────────────────
export const themeVars = {
    light: {
        bg: "#F8F8FA",
        surface: "#FFFFFF",
        surfaceHover: "#F9FAFB",
        border: "#EBEBF0",
        borderHover: "#D1D5DB",
        text: "#1A1A2E",
        textSub: "#6B7280",
        textMuted: "#9CA3AF",
        inputBg: "#F9FAFB",
        headerBg: "#FFFFFF",
        sidebarBg: "#FFFFFF",
        gridLine: "#F0F0F4",
        gridLabel: "#C4C9D4",
        rowHover: "#FAFAFA",
        chartHover: "#F5F5FF",
        tooltipBg: "#1C1C2E",
        tooltipText: "white",
        btnSecBg: "#F3F4F6",
        btnSecColor: "#374151",
    },
    dark: {
        bg: "#000000",
        surface: "#111111",
        surfaceHover: "#1A1A1A",
        border: "#2A2A2A",
        borderHover: "#3A3A3A",
        text: "#F0F0F0",
        textSub: "#A0A0A0",
        textMuted: "#666666",
        inputBg: "#1A1A1A",
        headerBg: "#0A0A0A",
        sidebarBg: "#0A0A0A",
        gridLine: "#1E1E1E",
        gridLabel: "#444444",
        rowHover: "#1A1A1A",
        chartHover: "rgba(108,99,255,0.08)",
        tooltipBg: "#1A1A1A",
        tooltipText: "#F0F0F0",
        btnSecBg: "#1A1A1A",
        btnSecColor: "#A0A0A0",
    },
} as const;
