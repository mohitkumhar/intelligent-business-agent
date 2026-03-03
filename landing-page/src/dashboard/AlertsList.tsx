import * as React from "react";

interface Alert {
    id: number;
    type: string;
    severity: "High" | "Medium" | "Low";
    message: string;
    time: string;
}

export function AlertsList() {
    const alerts: Alert[] = [
        {
            id: 1,
            type: "Cash Flow Warning",
            severity: "High",
            message: "At current burn rate, cash reserves may deplete in 40 days.",
            time: "2 hours ago"
        },
        {
            id: 2,
            type: "Expense Anomaly",
            severity: "Medium",
            message: "Marketing expenses increased by 35% compared to last month.",
            time: "1 day ago"
        },
        {
            id: 3,
            type: "Target Met",
            severity: "Low",
            message: "Weekly sales target achieved 2 days early. Great job!",
            time: "2 days ago"
        }
    ];

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case "High":
                return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20";
            case "Medium":
                return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20";
            case "Low":
                return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";
            default:
                return "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20";
        }
    };

    const getIconStyle = (severity: string) => {
        switch (severity) {
            case "High":
                return "text-rose-600 dark:text-rose-400";
            case "Medium":
                return "text-amber-600 dark:text-amber-400";
            case "Low":
                return "text-emerald-600 dark:text-emerald-400";
            default:
                return "text-slate-600 dark:text-slate-400";
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Active Alerts
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Issues requiring your attention</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                    {alerts.filter(a => a.severity === 'High').length} Critical
                </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.map((alert) => (
                    <div key={alert.id} className="group flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                        <div className="mt-1 flex-shrink-0">
                            {alert.severity === 'High' ? (
                                <svg className={`w-5 h-5 ${getIconStyle(alert.severity)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : alert.severity === 'Medium' ? (
                                <svg className={`w-5 h-5 ${getIconStyle(alert.severity)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className={`w-5 h-5 ${getIconStyle(alert.severity)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {alert.type}
                                </h3>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getSeverityStyle(alert.severity)}`}>
                                    {alert.severity}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                                {alert.message}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                                {alert.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    View all alerts &rarr;
                </button>
            </div>
        </div>
    );
}
