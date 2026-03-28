/* ──────────────────────────────────────────────────────────────────
   dashboard.js – Fetches data & renders Chart.js charts
   ────────────────────────────────────────────────────────────────── */

(function () {
    "use strict";

    // ── Chart.js global defaults ───────────────────────────────────
    Chart.defaults.color = "#9ea2b8";
    Chart.defaults.borderColor = "rgba(46,49,72,0.5)";
    Chart.defaults.font.family = "'Inter', sans-serif";

    const COLORS = {
        blue:    "#5b8af5",
        green:   "#4ecb71",
        red:     "#f55b6a",
        orange:  "#f5a623",
        purple:  "#a855f7",
        cyan:    "#22d3ee",
        pink:    "#ec4899",
        lime:    "#84cc16",
    };

    const PALETTE = Object.values(COLORS);

    function rgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function currency(n) {
        return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    // ── Fetch helpers ──────────────────────────────────────────────
    async function fetchJSON(url) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (err) {
            console.error(`Failed to fetch ${url}:`, err);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // KPI Cards
    // ═══════════════════════════════════════════════════════════════
    async function loadKPI() {
        const data = await fetchJSON("/api/dashboard/summary");
        if (!data || data.error) return;

        document.getElementById("kpiRevenue").textContent     = currency(data.total_revenue);
        document.getElementById("kpiExpenses").textContent    = currency(data.total_expenses);
        document.getElementById("kpiProfit").textContent      = currency(data.net_profit);
        document.getElementById("kpiTransactions").textContent = data.total_transactions;
        document.getElementById("kpiAlerts").textContent       = data.active_alerts;

        // Color net profit
        const profitEl = document.getElementById("kpiProfit");
        profitEl.style.color = data.net_profit >= 0 ? COLORS.green : COLORS.red;
    }

    // ═══════════════════════════════════════════════════════════════
    // Revenue vs Expense by Category
    // ═══════════════════════════════════════════════════════════════
    async function loadRevenueExpense() {
        const data = await fetchJSON("/api/dashboard/revenue-vs-expense");
        if (!data || data.error) return;

        new Chart(document.getElementById("revenueExpenseChart"), {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Revenue",
                        data: data.revenue,
                        backgroundColor: rgba(COLORS.blue, 0.7),
                        borderColor: COLORS.blue,
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                    {
                        label: "Expenses",
                        data: data.expenses,
                        backgroundColor: rgba(COLORS.red, 0.7),
                        borderColor: COLORS.red,
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top" },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${currency(ctx.parsed.y)}` } },
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: (v) => currency(v) }, grid: { color: "rgba(46,49,72,0.3)" } },
                    x: { grid: { display: false } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Transactions by Category (Pie)
    // ═══════════════════════════════════════════════════════════════
    async function loadTransactionsPie() {
        const data = await fetchJSON("/api/dashboard/transactions-by-category");
        if (!data || data.error) return;

        new Chart(document.getElementById("transactionsPieChart"), {
            type: "pie",
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: PALETTE.slice(0, data.labels.length),
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { padding: 12 } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Sales Trend (Line)
    // ═══════════════════════════════════════════════════════════════
    async function loadSalesTrend() {
        const data = await fetchJSON("/api/dashboard/sales-trend");
        if (!data || data.error) return;

        new Chart(document.getElementById("salesTrendChart"), {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Revenue",
                        data: data.revenue,
                        borderColor: COLORS.blue,
                        backgroundColor: rgba(COLORS.blue, 0.1),
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                    {
                        label: "Expenses",
                        data: data.expenses,
                        borderColor: COLORS.red,
                        backgroundColor: rgba(COLORS.red, 0.1),
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top" },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${currency(ctx.parsed.y)}` } },
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: (v) => currency(v) }, grid: { color: "rgba(46,49,72,0.3)" } },
                    x: { grid: { display: false } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Alerts by Severity (Doughnut)
    // ═══════════════════════════════════════════════════════════════
    async function loadAlertsSeverity() {
        const data = await fetchJSON("/api/dashboard/alerts-by-severity");
        if (!data || data.error) return;

        const severityColors = { Low: COLORS.green, Medium: COLORS.orange, High: COLORS.red };

        new Chart(document.getElementById("alertsSeverityChart"), {
            type: "doughnut",
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: data.labels.map((l) => severityColors[l] || COLORS.purple),
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "55%",
                plugins: {
                    legend: { position: "bottom", labels: { padding: 12 } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Financial Overview (Monthly)
    // ═══════════════════════════════════════════════════════════════
    async function loadFinancialOverview() {
        const data = await fetchJSON("/api/dashboard/financial-overview");
        if (!data || data.error) return;

        new Chart(document.getElementById("financialOverviewChart"), {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        type: "line",
                        label: "Net Profit",
                        data: data.net_profit,
                        borderColor: COLORS.green,
                        backgroundColor: rgba(COLORS.green, 0.1),
                        fill: false,
                        tension: 0.3,
                        pointRadius: 3,
                        yAxisID: "y",
                        order: 0,
                    },
                    {
                        label: "Revenue",
                        data: data.revenue,
                        backgroundColor: rgba(COLORS.blue, 0.6),
                        borderRadius: 4,
                        yAxisID: "y",
                        order: 1,
                    },
                    {
                        label: "Expenses",
                        data: data.expenses,
                        backgroundColor: rgba(COLORS.red, 0.6),
                        borderRadius: 4,
                        yAxisID: "y",
                        order: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top" },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${currency(ctx.parsed.y)}` } },
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: (v) => currency(v) }, grid: { color: "rgba(46,49,72,0.3)" } },
                    x: { grid: { display: false } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Top Products (Horizontal Bar)
    // ═══════════════════════════════════════════════════════════════
    async function loadTopProducts() {
        const data = await fetchJSON("/api/dashboard/top-products");
        if (!data || data.error) return;

        new Chart(document.getElementById("topProductsChart"), {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Stock Qty",
                        data: data.stock,
                        backgroundColor: rgba(COLORS.cyan, 0.7),
                        borderColor: COLORS.cyan,
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: "Profit Margin ($)",
                        data: data.margin,
                        backgroundColor: rgba(COLORS.green, 0.7),
                        borderColor: COLORS.green,
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: {
                    x: { beginAtZero: true, grid: { color: "rgba(46,49,72,0.3)" } },
                    y: { grid: { display: false } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Health Scores (Radar)
    // ═══════════════════════════════════════════════════════════════
    async function loadHealthScores() {
        const data = await fetchJSON("/api/dashboard/health-scores");
        if (!data || data.error || !data.scores.length) return;

        const labels = ["Overall", "Cash", "Profitability", "Growth", "Cost Control", "Risk"];
        const datasets = data.scores.map((s, i) => ({
            label: s.name,
            data: [s.overall, s.cash, s.profitability, s.growth, s.cost_control, s.risk],
            borderColor: PALETTE[i % PALETTE.length],
            backgroundColor: rgba(PALETTE[i % PALETTE.length], 0.1),
            pointBackgroundColor: PALETTE[i % PALETTE.length],
            pointRadius: 3,
        }));

        new Chart(document.getElementById("healthScoresChart"), {
            type: "radar",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        angleLines: { color: "rgba(46,49,72,0.4)" },
                        grid: { color: "rgba(46,49,72,0.3)" },
                        pointLabels: { font: { size: 11 } },
                    },
                },
                plugins: { legend: { position: "bottom", labels: { padding: 10 } } },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Employee Stats (Bar)
    // ═══════════════════════════════════════════════════════════════
    async function loadEmployeeStats() {
        const data = await fetchJSON("/api/dashboard/employee-stats");
        if (!data || data.error) return;

        const statusColors = { Active: COLORS.green, Left: COLORS.red };

        new Chart(document.getElementById("employeeStatsChart"), {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Count",
                        data: data.counts,
                        backgroundColor: data.labels.map((l) => rgba(statusColors[l] || COLORS.purple, 0.7)),
                        borderColor: data.labels.map((l) => statusColors[l] || COLORS.purple),
                        borderWidth: 1,
                        borderRadius: 6,
                        yAxisID: "y",
                    },
                    {
                        label: "Avg Salary ($)",
                        data: data.avg_salary,
                        backgroundColor: data.labels.map(() => rgba(COLORS.cyan, 0.5)),
                        borderColor: data.labels.map(() => COLORS.cyan),
                        borderWidth: 1,
                        borderRadius: 6,
                        yAxisID: "y1",
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: {
                    y:  { beginAtZero: true, position: "left",  title: { display: true, text: "Count" }, grid: { color: "rgba(46,49,72,0.3)" } },
                    y1: { beginAtZero: true, position: "right", title: { display: true, text: "Avg Salary" }, grid: { display: false },
                          ticks: { callback: (v) => currency(v) } },
                    x:  { grid: { display: false } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════════════
    async function init() {
        await Promise.all([
            loadKPI(),
            loadRevenueExpense(),
            loadTransactionsPie(),
            loadSalesTrend(),
            loadAlertsSeverity(),
            loadFinancialOverview(),
            loadTopProducts(),
            loadHealthScores(),
            loadEmployeeStats(),
        ]);
    }

    // Re-fetch every 60 seconds
    init();
    setInterval(init, 60000);
})();
