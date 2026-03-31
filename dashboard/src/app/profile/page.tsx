"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api, type BusinessInfo } from "@/lib/api";

function getLocalUser(): { full_name?: string; email?: string; phone?: string } {
  try {
    return JSON.parse(localStorage.getItem("profit_pilot_user") || "{}");
  } catch {
    return {};
  }
}

export default function ProfilePage() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [local, setLocal] = useState(getLocalUser);

  useEffect(() => {
    setLocal(getLocalUser());
    api
      .getBusinessInfo()
      .then((b) => {
        setBusiness(b);
        if (b?.user_name) {
          const u = getLocalUser();
          localStorage.setItem(
            "profit_pilot_user",
            JSON.stringify({ ...u, full_name: b.user_name }),
          );
          window.dispatchEvent(new Event("profitpilot-user"));
          setLocal(getLocalUser());
        }
      })
      .catch(() => setBusiness(null))
      .finally(() => setLoading(false));
  }, []);

  const displayName =
    business?.user_name?.trim() ||
    local.full_name?.trim() ||
    "—";
  const showEmail =
    business?.user_email?.trim() || local.email?.trim() || "—";

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar onSearch={() => {}} title="Profile" />
        <div className="content-wrapper">
          <header style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontSize: "clamp(1.35rem, 2vw, 1.65rem)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Your profile
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
              Details from onboarding and your ProfitPilot session.
            </p>
          </header>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 20,
                maxWidth: 640,
              }}
            >
              <section
                style={{
                  padding: "22px 24px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 16,
                  }}
                >
                  User
                </h2>
                <dl
                  style={{
                    display: "grid",
                    gap: 12,
                    fontSize: 14,
                  }}
                >
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Name</dt>
                    <dd style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>
                      {displayName}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Email</dt>
                    <dd style={{ marginTop: 4 }}>{showEmail}</dd>
                  </div>
                  {local.phone ? (
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Phone</dt>
                      <dd style={{ marginTop: 4 }}>{local.phone}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section
                style={{
                  padding: "22px 24px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 16,
                  }}
                >
                  Business
                </h2>
                {business ? (
                  <dl style={{ display: "grid", gap: 12, fontSize: 14 }}>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Company</dt>
                      <dd style={{ fontWeight: 600, marginTop: 4 }}>{business.business_name}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Industry</dt>
                      <dd style={{ marginTop: 4 }}>{business.industry_type || "—"}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>City</dt>
                      <dd style={{ marginTop: 4 }}>{business.city || "—"}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Team size</dt>
                      <dd style={{ marginTop: 4 }}>{business.employees_range || "—"}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        Monthly revenue (onboarding)
                      </dt>
                      <dd style={{ marginTop: 4 }}>
                        {business.monthly_revenue || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Biggest challenge</dt>
                      <dd style={{ marginTop: 4 }}>{business.biggest_challenge || "—"}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: 12 }}>Finance tracking</dt>
                      <dd style={{ marginTop: 4 }}>{business.finance_tracking_method || "—"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    No business record found for your session email. Complete onboarding on the
                    landing page first.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
