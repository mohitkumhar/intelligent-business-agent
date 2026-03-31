"use client";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BusinessDetails from "@/components/BusinessDetails";

export default function ProfilePage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar onSearch={() => {}} />
        <div className="content-wrapper">
          <div className="welcome-banner">
            <div className="welcome-text">
              <h2>Business Profile</h2>
              <p>Review and update your business onboarding details</p>
            </div>
          </div>
          
          <div className="mt-6">
            <BusinessDetails />
          </div>
        </div>
      </div>
    </div>
  );
}
