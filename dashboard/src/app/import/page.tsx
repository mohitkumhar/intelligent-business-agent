"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DragEvent, ReactNode, RefObject } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { FileUpIcon, ReceiptIcon, BarChartIcon } from "@/components/Icons";
import { AGENT_API_BASE } from "@/lib/publicUrls";
import { dispatchDashboardRefresh } from "@/lib/dashboardRefresh";

function getUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const u = JSON.parse(localStorage.getItem("profit_pilot_user") || "{}") as {
      email?: string;
    };
    const e = u.email?.trim();
    return e || null;
  } catch {
    return null;
  }
}

function downloadSampleCsv() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${d}`;
  const csv = `date,type,category,amount,description
${today},Revenue,Sales,4500.00,Sample Product sales
2026-01-15,Revenue,Sales,1500.00,Old Product sale
2026-01-16,Expense,Rent,800.00,Office rent
2026-01-17,Expense,Marketing,250.00,Online ads
`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "profitpilot-import-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type Flash = { kind: "success" | "error"; text: string } | null;

export default function ImportPage() {
  const [flash, setFlash] = useState<Flash>(null);
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showEmailWarn, setShowEmailWarn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShowEmailWarn(!getUserEmail());
  }, []);

  const excelRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const postSpreadsheet = async (file: File, source: string) => {
    const email = getUserEmail() || "demo@profitpilot.ai";
    setUploading(true);
    setFlash(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("email", email);
    fd.append("source", source);
    try {
      const res = await fetch(`${AGENT_API_BASE}/api/v1/import/transactions`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { error?: string; message?: string; imported?: number };
      
      // USER REQUEST: Always mock data so we see DASHBOARD results with transition.
      localStorage.setItem("profitpilot_mock_mode", "true");
      
      if (!res.ok) {
        console.warn("Import failed, but triggering MOCK MODE for dashboard as requested.", data.error);
        setFlash({ kind: "success", text: "Mocking data for dashboard… Redirecting… (Import API had error)" });
      } else {
        setFlash({
          kind: "success",
          text: data.message || `Imported ${data.imported ?? 0} row(s). Redirecting to Dashboard…`,
        });
      }
      
      dispatchDashboardRefresh();
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      console.error("API Fetch Error:", err);
      // Fallback for user request: even if backend is down, show mock dashboard.
      localStorage.setItem("profitpilot_mock_mode", "true");
      setFlash({ kind: "success", text: "Triggering MOCK dashboard… Redirecting…" });
      dispatchDashboardRefresh();
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } finally {
      setUploading(false);
    }
  };

  const postReceipt = async (file: File) => {
    const email = getUserEmail() || "demo@profitpilot.ai";
    setUploading(true);
    setFlash(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("email", email);
    try {
      const res = await fetch(`${AGENT_API_BASE}/api/v1/import/receipt`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { error?: string; message?: string };

      // USER REQUEST: Always mock data so we see DASHBOARD results with transition.
      localStorage.setItem("profitpilot_mock_mode", "true");

      if (!res.ok) {
        console.warn("Receipt upload failed, but triggering MOCK MODE as requested.", data.error);
        setFlash({ kind: "success", text: "Mocking data for dashboard… Redirecting… (Upload API error)" });
      } else {
        setFlash({
          kind: "success",
          text: data.message || "Image saved successfully. Processing…",
        });
      }

      dispatchDashboardRefresh();
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      console.error("API error:", err);
      // Fallback for user request: even if backend is down, show mock dashboard.
      localStorage.setItem("profitpilot_mock_mode", "true");
      setFlash({ kind: "success", text: "Triggering MOCK dashboard… Redirecting…" });
      dispatchDashboardRefresh();
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } finally {
      setUploading(false);
    }
  };

  function handleDrop(
    e: DragEvent,
    mode: "sheet-excel" | "sheet-acc" | "image",
  ) {
    e.preventDefault();
    e.stopPropagation();
    setDragId(null);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (mode === "sheet-excel" || mode === "sheet-acc") {
      const ok =
        f.name.toLowerCase().endsWith(".csv") ||
        f.name.toLowerCase().endsWith(".xlsx");
      if (!ok) {
        setFlash({ kind: "error", text: "Drop a .csv or .xlsx file." });
        return;
      }
      void postSpreadsheet(
        f,
        mode === "sheet-acc" ? "accounting" : "excel",
      );
    } else {
      if (!f.type.startsWith("image/")) {
        setFlash({ kind: "error", text: "Drop an image file (PNG, JPG, …)." });
        return;
      }
      void postReceipt(f);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar onSearch={() => { }} title="Import data" />

        <div className="content-wrapper">
          <div className="welcome-banner">
            <div className="welcome-text">
              <h2>Import your data</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: 720 }}>
                Choose how you want to bring your business data into ProfitPilot — same layout as
                your dashboard. Files are tied to <strong style={{ color: "var(--text-primary)" }}>your business email</strong> in this session.
              </p>
            </div>
          </div>

          <section className="import-page-hero" style={{ marginTop: 0 }}>
            {showEmailWarn ? (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "var(--accent-amber-light)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  color: "#92400e",
                  fontSize: 13,
                  marginBottom: flash ? 12 : 0,
                }}
              >
                No session email found. Open the app from the landing page with your account, or
                add{" "}
                <code style={{ fontSize: 12 }}>?user_email=you@company.com</code> to the dashboard
                URL.
              </div>
            ) : null}
            {flash ? (
              <div
                role="status"
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.45,
                  background:
                    flash.kind === "success"
                      ? "var(--accent-green-light)"
                      : "var(--accent-red-light)",
                  color: flash.kind === "success" ? "#065f46" : "#991b1b",
                  border:
                    flash.kind === "success"
                      ? "1px solid rgba(16, 185, 129, 0.35)"
                      : "1px solid rgba(239, 68, 68, 0.35)",
                }}
              >
                {flash.text}
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: showEmailWarn || flash ? 16 : 0 }}>
              <button
                type="button"
                onClick={downloadSampleCsv}
                disabled={uploading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                Download sample CSV
              </button>
              {uploading && (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Uploading…</span>
              )}
            </div>
          </section>

          <div className="import-card-grid">
            <ImportCard
              step="Option A"
              id="excel"
              title="Excel / Google Sheets"
              subtitle="Export as .csv or save as .xlsx, then upload."
              icon={<BarChartIcon size={26} color="#10B981" />}
              accent="#10B981"
              dragOver={dragId === "excel"}
              onDragEnter={() => setDragId("excel")}
              onDragLeave={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "sheet-excel")}
              primaryLabel="Upload spreadsheet"
              onPrimary={() => excelRef.current?.click()}
              secondaryLabel="Skip for now"
              secondaryHref="/"
              inputRef={excelRef}
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onFile={(f) => void postSpreadsheet(f, "excel")}
              uploading={uploading}
            />
            <ImportCard
              step="Option B"
              id="acc"
              title="Tally / Zoho / QuickBooks"
              subtitle="Use an export file (.csv / .xlsx) from your accounting tool."
              icon={<ReceiptIcon size={26} color="#3B82F6" />}
              accent="#3B82F6"
              dragOver={dragId === "acc"}
              onDragEnter={() => setDragId("acc")}
              onDragLeave={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "sheet-acc")}
              primaryLabel="Upload export file"
              onPrimary={() => exportRef.current?.click()}
              secondaryLabel="Skip for now"
              secondaryHref="/"
              inputRef={exportRef}
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onFile={(f) => void postSpreadsheet(f, "accounting")}
              uploading={uploading}
            />
            <ImportCard
              step="Option C"
              id="img"
              title="Notebook / manual"
              subtitle="Photo of a ledger or receipt — stored securely for future AI parsing."
              icon={<FileUpIcon size={26} color="#F59E0B" />}
              accent="#F59E0B"
              dragOver={dragId === "img"}
              onDragEnter={() => setDragId("img")}
              onDragLeave={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "image")}
              primaryLabel="Upload image"
              onPrimary={() => imageRef.current?.click()}
              secondaryLabel="Skip for now"
              secondaryHref="/"
              inputRef={imageRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onFile={(f) => void postReceipt(f)}
              uploading={uploading}
            />
          </div>

          <div className="import-guide-grid">
            <section className="import-guide-box">
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: 14, color: "var(--text-primary)" }}>
                Spreadsheet columns
              </h2>
              <ul
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  lineHeight: 1.65,
                  paddingLeft: 18,
                  display: "grid",
                  gap: 10,
                }}
              >
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Required:</strong>{" "}
                  <code style={{ fontSize: 13 }}>date</code>, <code style={{ fontSize: 13 }}>amount</code>
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Optional:</strong>{" "}
                  <code style={{ fontSize: 13 }}>type</code> (Revenue / Expense),{" "}
                  <code style={{ fontSize: 13 }}>category</code>, <code style={{ fontSize: 13 }}>description</code>
                </li>
                <li>
                  Missing <code style={{ fontSize: 13 }}>type</code>: positive amount → Revenue, negative → Expense.
                </li>
              </ul>
            </section>
            <section className="import-guide-box">
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: 14, color: "var(--text-primary)" }}>
                Tips
              </h2>
              <ul style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, paddingLeft: 18, display: "grid", gap: 10 }}>
                <li>CSV and .xlsx (Excel 2007+) are supported.</li>
                <li>After import, open <strong style={{ color: "var(--text-primary)" }}>Dashboard</strong> to see updated charts.</li>
                <li>Photos are stored for future AI extraction; spreadsheets import into transactions immediately.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportCard(props: {
  step: string;
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  dragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  secondaryHref: string;
  inputRef: RefObject<HTMLInputElement | null>;
  accept: string;
  onFile: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div
      className="import-method-card"
      onDragEnter={props.onDragEnter}
      onDragLeave={props.onDragLeave}
      onDragOver={props.onDragOver}
      onDrop={props.onDrop}
      style={{
        border: props.dragOver
          ? `2px dashed ${props.accent}`
          : "1px solid var(--border-color)",
        boxShadow: props.dragOver ? `0 16px 48px ${props.accent}28` : undefined,
      }}
    >
      <div className="import-step-label">{props.step}</div>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: `${props.accent}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {props.icon}
      </div>
      <h3
        style={{
          fontSize: "1.05rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        {props.title}
      </h3>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55, flex: 1, marginBottom: 8 }}>
        {props.subtitle}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
        Drag & drop here or use the button
      </p>
      <input
        ref={props.inputRef}
        type="file"
        accept={props.accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) props.onFile(f);
        }}
      />
      <button
        type="button"
        className="import-btn-primary"
        disabled={props.uploading}
        onClick={props.onPrimary}
      >
        {props.primaryLabel}
      </button>
      <Link
        href={props.secondaryHref}
        style={{
          marginTop: 12,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-muted)",
          textDecoration: "none",
        }}
      >
        {props.secondaryLabel}
      </Link>
    </div>
  );
}
