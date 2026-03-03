import * as React from "react";

interface Decision {
    id: number;
    text: string;
    type: string;
    risk: "Safe" | "Risky" | "Do Not Do";
    date: string;
}

export function RecentDecisions() {
    const decisions: Decision[] = [
        {
            id: 1,
            text: "Spend ₹10,000 on Facebook Ads for Diwali campaign",
            type: "Marketing",
            risk: "Risky",
            date: "Today"
        },
        {
            id: 2,
            text: "Hire a new junior accountant at ₹15k/month",
            type: "Hiring",
            risk: "Safe",
            date: "Yesterday"
        },
        {
            id: 3,
            text: "Increase price of premium package by 40%",
            type: "Pricing",
            risk: "Do Not Do",
            date: "Oct 24"
        }
    ];

    const getRiskStyle = (risk: string) => {
        switch (risk) {
            case "Safe":
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
            case "Risky":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
            case "Do Not Do":
                return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
        }
    };

    const getRiskIcon = (risk: string) => {
        switch (risk) {
            case "Safe":
                return (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case "Risky":
                return (
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case "Do Not Do":
                return (
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        AI Decision Checks
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recent advice given by your AI partner</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {decisions.map((decision) => (
                    <div key={decision.id} className="group relative flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">

                        {getRiskIcon(decision.risk)}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {decision.type}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskStyle(decision.risk)}`}>
                                    {decision.risk}
                                </span>
                            </div>

                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {decision.text}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Evaluated {decision.date}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 rounded-lg text-sm font-semibold transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Evaluate New Decision
                </button>
            </div>
        </div>
    );
}
