"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api, TopProducts as TopProductsData } from "@/lib/api";
import { PackageIcon } from "@/components/Icons";

import { DashboardPeriodProvider } from "@/context/DashboardPeriodContext";

export default function InventoryPage() {
  const [data, setData] = useState<TopProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTopProducts()
      .then((res) => {
        if (res?.labels) setData(res);
        else setError("No inventory data available.");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load inventory data.");
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
                <h2>Inventory & Stock</h2>
                <p>Manage your products and monitor stock levels</p>
              </div>
            </div>

            <div className="table-card mt-6">
              <div className="table-header">
                <h3 className="table-title">Products Inventory</h3>
              </div>

              {loading ? (
                <div className="loading-spinner">Loading inventory...</div>
              ) : error ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>{error}</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Stock Quantity</th>
                      <th>Profit Margin ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data || data.labels.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                          No products found.
                        </td>
                      </tr>
                    ) : data.labels.map((name, i) => (
                      <tr key={name}>
                        <td style={{ fontWeight: 500 }}>
                          <div className="flex items-center gap-2">
                            <PackageIcon size={16} color="var(--accent-blue)" />
                            {name}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${(data.stock[i] ?? 0) < 20 ? 'expense' : 'revenue'}`}>
                            {data.stock[i] ?? 0} units
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ${(data.margin[i] ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
