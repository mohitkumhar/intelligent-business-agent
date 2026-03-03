import * as React from "react";

export function FinancialOverview() {
    const metrics = [
        {
            label: "Total Revenue (MTD)",
            value: "₹24,500",
            change: "+12.5%",
            trend: "up",
            icon: (
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: "bg-emerald-50 dark:bg-emerald-500/10"
        },
        {
            label: "Total Expenses (MTD)",
            value: "₹18,200",
            change: "+24.1%",
            trend: "bad", // went up but it's an expense
            icon: (
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            ),
            color: "bg-rose-50 dark:bg-rose-500/10"
        },
        {
            label: "Net Profit",
            value: "₹6,300",
            change: "-5.4%",
            trend: "down",
            icon: (
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: "bg-indigo-50 dark:bg-indigo-500/10"
        },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Financial Performance
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Month-to-date summary</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
                {metrics.map((m, idx) => (
                    <div key={idx} className="flex flex-col justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between xl:justify-start gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${m.color}`}>
                                {m.icon}
                            </div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {m.label}
                            </span>
                        </div>

                        <div>
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {m.value}
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                {m.trend === 'up' && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        {m.change}
                                    </span>
                                )}

                                {m.trend === 'bad' && (
                                    <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        {m.change}
                                    </span>
                                )}

                                {m.trend === 'down' && (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        {m.change}
                                    </span>
                                )}

                                <span className="text-slate-400 ml-2">from last month</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
