import * as React from "react";

interface SubjectScore {
    label: string;
    score: number;
}

export function BusinessHealthCard() {
    const overallScore = 65;
    const metrics: SubjectScore[] = [
        { label: "Cash Flow", score: 45 },
        { label: "Profitability", score: 72 },
        { label: "Growth", score: 85 },
        { label: "Cost Control", score: 58 },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Business Health
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time AI analysis of your metrics</p>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <div className="relative">
                        {/* SVG Circle representing the score */}
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-100 dark:text-slate-700"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={28 * 2 * Math.PI}
                                strokeDashoffset={(28 * 2 * Math.PI) - ((28 * 2 * Math.PI) * (overallScore / 100))}
                                className="text-amber-500 transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-slate-900 dark:text-white">{overallScore}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-5 flex-1 flex flex-col justify-center">
                {metrics.map((metric, idx) => {
                    const getProgressColor = (score: number) => {
                        if (score >= 80) return "bg-green-500";
                        if (score >= 60) return "bg-amber-400";
                        return "bg-rose-500";
                    };

                    return (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{metric.label}</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{metric.score}/100</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`${getProgressColor(metric.score)} h-2 rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${metric.score}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
