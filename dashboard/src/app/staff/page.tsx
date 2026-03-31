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

  useEffect(() => {
    api.getEmployeeStats()
      .then(setData)
      .catch(console.error)
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
                    {data?.labels.map((status, i) => (
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
                          ${data.avg_salary[i].toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
