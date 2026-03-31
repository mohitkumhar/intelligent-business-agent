"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RecentTransactions from "@/components/RecentTransactions";

import { DashboardPeriodProvider } from "@/context/DashboardPeriodContext";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardPeriodProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Topbar onSearch={setSearchQuery} />
          <div className="content-wrapper">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>All Transactions</h2>
                <p>View and manage your business financial history</p>
              </div>
            </div>
            
            <div className="mt-6">
              <RecentTransactions search={searchQuery} />
            </div>
          </div>
        </div>
      </div>
    </DashboardPeriodProvider>
  );
}
