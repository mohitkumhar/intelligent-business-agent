"use client";
import { ChevronDownIcon, ExportIcon } from "./Icons";

export default function WelcomeBanner() {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="welcome-banner">
      <div className="welcome-text">
        <h2>Welcome back!</h2>
        <p>{dateStr}</p>
      </div>
      <div className="welcome-actions">
        <button className="filter-dropdown">
          This Month <ChevronDownIcon size={14} />
        </button>
        <button className="export-btn">
          <ExportIcon size={14} /> Export
        </button>
      </div>
    </div>
  );
}
