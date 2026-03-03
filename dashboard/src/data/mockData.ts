export const months = ["Apr '25", "May '25", "Jun '25", "Jul '25", "Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26", "Feb '26", "Mar '26"];

export const lineChartData = months.map(m => ({
    name: m,
    "Gross Profit": Math.floor(Math.random() * 200000) + 50000,
    "Gross Margin": Math.floor(Math.random() * 50) + 70,
    "Operating Profit (Loss)": Math.floor(Math.random() * 100000) - 20000,
    "Operating Margin": Math.floor(Math.random() * 40) - 10,
    "Net Profit (Loss)": Math.floor(Math.random() * 100000) - 30000,
    "Net Margin": Math.floor(Math.random() * 40) - 15,
}));

export const revenueData = months.map(m => ({
    name: m,
    "Cost of Goods Sold": Math.floor(Math.random() * 50000) + 10000,
    "Gross Profit": Math.floor(Math.random() * 250000) + 50000,
}));

export const incomeByNameData = months.map(m => ({
    name: m,
    "Sales": Math.floor(Math.random() * 150000) + 50000,
    "Service": Math.floor(Math.random() * 150000) + 50000,
}));

export const expensesByTypeData = months.map(m => ({
    name: m,
    "Expense": Math.floor(Math.random() * 150000) + 50000,
    "Cost of Goods Sold": Math.floor(Math.random() * 50000) + 10000,
}));

export const expensesByNameData = months.map(m => ({
    name: m,
    "Wages & Salaries": Math.floor(Math.random() * 50000) + 30000,
    "Subcontractors": Math.floor(Math.random() * 20000) + 5000,
    "Rent office space": Math.floor(Math.random() * 15000) + 10000,
    "Payroll Tax Expense": Math.floor(Math.random() * 10000) + 5000,
    "Payment Provider Fees Stripe": Math.floor(Math.random() * 5000) + 2000,
    "Utilities office space": Math.floor(Math.random() * 3000) + 1000,
    "Office expenses miscellaneous": Math.floor(Math.random() * 2000) + 500,
    "Bank Revaluations": Math.floor(Math.random() * 10000) - 5000,
    "Unrealized Currency Gains": Math.floor(Math.random() * 5000) - 2500,
    "Others": Math.floor(Math.random() * 5000) + 1000,
}));

export const donutDataToday = [
    { name: "Rent office space", value: 35000, color: "#0078D4" },
    { name: "Wages & Salaries", value: 24000, color: "#D13438" },
    { name: "Payroll Tax Expense", value: 12000, color: "#FFB900" },
    { name: "Bank Revaluations", value: 8000, color: "#8764B8" },
    { name: "Utilities office space", value: 5000, color: "#00B294" },
    { name: "Unrealized Currency Gains", value: 3000, color: "#7A7574" },
    { name: "Realized Currency Gains", value: 1500, color: "#00CC6A" },
];

export const donutDataLastMonth = [
    { name: "Wages & Salaries", value: 28000, color: "#0078D4" },
    { name: "Rent office space", value: 25000, color: "#D13438" },
    { name: "Payroll Tax Expense", value: 10000, color: "#FFB900" },
    { name: "Utilities office space", value: 5000, color: "#8764B8" },
    { name: "Office expenses miscellaneous", value: 4000, color: "#00B294" },
    { name: "Unrealized Currency Gains", value: 2000, color: "#7A7574" },
    { name: "Bank Revaluations", value: -1000, color: "#C8C6C4" },
    { name: "Realized Currency Gains", value: -500, color: "#00CC6A" },
];
