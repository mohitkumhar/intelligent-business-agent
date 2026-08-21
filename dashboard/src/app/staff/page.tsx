"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api, EmployeeStats as EmployeeStatsData } from "@/lib/api";
import { UsersIcon } from "@/components/Icons";

import { DashboardPeriodProvider } from "@/context/DashboardPeriodContext";

export default function StaffPage() {
  const [data, setData] = useState<EmployeeStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEmployeeStats()
      .then((res) => {
        if (res?.labels) setData(res);
        else setError("No employee data available.");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load staff data.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardPeriodProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Topbar onSearch={() => {}} />
          <div className="content-wrapper">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Staff & Employees</h2>
                <p>Overview of your business employees and salaries</p>
              </div>
            </div>

            <div className="table-card mt-6">
              <div className="table-header">
                <h3 className="table-title">Employee Summary by Status</h3>
              </div>

              {loading ? (
                <div className="loading-spinner">Loading staff data...</div>
              ) : error ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>{error}</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Average Salary ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data || data.labels.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                          No employee data found.
                        </td>
                      </tr>
                    ) : data.labels.map((status, i) => (
                      <tr key={status}>
                        <td style={{ fontWeight: 500 }}>
                          <div className="flex items-center gap-2">
                            <UsersIcon size={16} color="var(--accent-purple)" />
                            {status}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge revenue">
                            {data.counts[i]} employees
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ${(data.avg_salary[i] ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardPeriodProvider>
  );
}
