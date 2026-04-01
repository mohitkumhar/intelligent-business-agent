"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";
import type { Alert } from "@/lib/api";
import { AlertTriangleIcon } from "@/components/Icons";
import { DashboardPeriodProvider } from "@/context/DashboardPeriodContext";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAlertsList()
      .then((data) => setAlerts(data.alerts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "#EF4444";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#3B82F6";
    }
  };

  return (
    <DashboardPeriodProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Topbar onSearch={() => {}} />
          <div className="content-wrapper">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Active Alerts</h2>
                <p>Monitor critical issues and business anomalies</p>
              </div>
            </div>

            <div className="table-card mt-6">
              <div className="table-header">
                <h3 className="table-title">Recent Alerts</h3>
              </div>

              {loading ? (
                <div className="loading-spinner">Loading alerts...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                          No active alerts found for this business.
                        </td>
                      </tr>
                    ) : (
                      alerts.map((alert) => (
                        <tr key={alert.alert_id}>
                          <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {new Date(alert.created_at).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>{alert.alert_type}</td>
                          <td>
                            <span 
                              className="status-badge" 
                              style={{ 
                                backgroundColor: `${getSeverityColor(alert.severity)}15`, 
                                color: getSeverityColor(alert.severity),
                                border: `1px solid ${getSeverityColor(alert.severity)}30`
                              }}
                            >
                              {alert.severity}
                            </span>
                          </td>
                          <td>{alert.message}</td>
                          <td>
                            <span className="status-badge revenue">
                              {alert.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
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
