"use client";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { UserIcon } from "@/components/Icons";

export default function AccountPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar onSearch={() => {}} />
        <div className="content-wrapper">
          <div className="welcome-banner">
            <div className="welcome-text">
              <h2>My Account</h2>
              <p>Manage your user profile and login credentials</p>
            </div>
          </div>
          
          <div className="table-card mt-6 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <UserIcon size={32} color="var(--text-muted)" />
            </div>
            <h3 className="text-xl font-bold mb-2">Account Management</h3>
            <p className="text-slate-500">This feature is coming soon to ProfitPilot!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
