export type DashboardPeriod = "this_month" | "last_month" | "ytd";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-calendar bounds as YYYY-MM-DD (inclusive). */
export function getPeriodBounds(period: DashboardPeriod): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const isoLocal = (year: number, monthIndex: number, day: number) =>
    `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

  if (period === "this_month") {
    return { start: `${y}-${pad(m + 1)}-01`, end: isoLocal(y, m, d) };
  }
  if (period === "last_month") {
    const firstThisMonth = new Date(y, m, 1);
    const lastDayPrev = new Date(firstThisMonth.getTime() - 86400000);
    const py = lastDayPrev.getFullYear();
    const pm = lastDayPrev.getMonth();
    return {
      start: `${py}-${pad(pm + 1)}-01`,
      end: isoLocal(py, pm, lastDayPrev.getDate()),
    };
  }
  return { start: `${y}-01-01`, end: isoLocal(y, m, d) };
}

export function periodLabel(period: DashboardPeriod): string {
  switch (period) {
    case "this_month":
      return "This Month";
    case "last_month":
      return "Last Month";
    case "ytd":
      return "Year to Date";
    default:
      return "This Month";
  }
}
