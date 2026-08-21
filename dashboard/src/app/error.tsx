"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-primary, #0F172A)",
        color: "var(--text-primary, #F1F5F9)",
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontSize: 28,
        }}
      >
        ??
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 32, maxWidth: 400 }}>
        This page encountered an error. This usually happens when the backend
        server is unreachable or returning unexpected data.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "#3B82F6",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            color: "#CBD5E1",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Back to Dashboard
        </button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <details
          style={{
            marginTop: 32,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
            padding: "16px 20px",
            maxWidth: 600,
            textAlign: "left",
            fontSize: 12,
            color: "#94A3B8",
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: 8 }}>
            Error details (dev only)
          </summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {error.message}
            {error.stack && "\n\n" + error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
