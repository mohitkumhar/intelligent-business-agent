"use client";

/**
 * MessageRenderer
 * ───────────────
 * Detects if the assistant response is a JSON business payload.
 * If yes → converts it to a formatted Markdown string and renders via ReactMarkdown.
 * If no  → renders the raw text directly with ReactMarkdown (existing behaviour).
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ─── types ─── */
interface BusinessResponse {
  status?: string;
  intent?: string;
  query_understood?: string;
  summary?: string;
  recommendations?: string[];
  risk_level?: string | null;
  follow_up_questions?: string[];
  /** nested envelope some nodes emit */
  result?: {
    summary?: string;
    recommendations?: string[];
    risk_level?: string;
    follow_up_questions?: string[];
  };
}

interface MessageRendererProps {
  content: string;
  intent?: string;
  /** Called when the user clicks a follow-up question chip */
  onFollowUpClick?: (question: string) => void;
}

/* ─── risk emoji map ─── */
const RISK_EMOJI: Record<string, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
};

/* ─── JSON → Markdown converter ─── */
function toMarkdown(data: BusinessResponse): string {
  const lines: string[] = [];

  // Flatten nested envelope
  const summary = data.summary ?? data.result?.summary ?? "";
  const recommendations: string[] =
    data.recommendations ??
    (Array.isArray(data.result?.recommendations)
      ? (data.result!.recommendations as string[])
      : []);
  const riskRaw = (
    data.risk_level ?? data.result?.risk_level ?? ""
  )
    .toString()
    .toLowerCase()
    .trim();
  const followUps: string[] = Array.isArray(data.follow_up_questions)
    ? data.follow_up_questions
    : [];
  const queryUnderstood = data.query_understood ?? "";

  /* 🧠 Query understood — italic subtitle */
  if (queryUnderstood) {
    lines.push(`> 🧠 *${queryUnderstood}*`);
    lines.push("");
  }

  /* 📋 Summary */
  if (summary) {
    lines.push(`📋 **Summary**`);
    lines.push(summary);
    lines.push("");
  }

  /* 💡 Recommendations */
  if (recommendations.length > 0) {
    lines.push(`💡 **Recommendations**`);
    recommendations.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  /* ⚠️ Risk Level */
  if (riskRaw && RISK_EMOJI[riskRaw]) {
    lines.push(
      `⚠️ **Risk Level:** ${RISK_EMOJI[riskRaw]} \`${riskRaw.toUpperCase()}\``
    );
    lines.push("");
  }



  return lines.join("\n");
}

/* ─── simple intents → no conversion ─── */
const SIMPLE_INTENTS = new Set([
  "greeting",
  "out_of_scope",
  "greeting_request",
]);

/* ══════════════════════════════════════════════
   Main export
   ══════════════════════════════════════════════ */
export default function MessageRenderer({
  content,
  intent,
  onFollowUpClick,
}: MessageRendererProps) {
    let parsed: BusinessResponse | null = null;
    try {
      if (typeof content === "string") {
          // Clean up markdown code blocks if the backend returns ```json ... ```
          let cleanContent = content.trim();
          if (cleanContent.startsWith("```")) {
              const lines = cleanContent.split("\n");
              // Remove first line (e.g., ```json) and last line (```)
              if (lines.length >= 2) {
                  lines.shift();
                  if (lines[lines.length - 1].trim() === "```") {
                      lines.pop();
                  }
                  cleanContent = lines.join("\n").trim();
              }
          }
          
          if (cleanContent.startsWith("{")) {
              parsed = JSON.parse(cleanContent);
          }
      }
    } catch {
      parsed = null;
    }

  /* 2. Not JSON → render as-is */
  if (!parsed) {
    return (
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  const effectiveStatus = (
    parsed.status ??
    parsed.intent ??
    intent ??
    ""
  ).toLowerCase();

  /* 3. Simple intents → just show summary as plain markdown */
  if (
    SIMPLE_INTENTS.has(effectiveStatus) ||
    SIMPLE_INTENTS.has((intent ?? "").toLowerCase())
  ) {
    const msg = parsed.summary ?? parsed.result?.summary ?? content;
    return (
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(msg)}</ReactMarkdown>
      </div>
    );
  }

  /* 4. Convert JSON → Markdown and render */
  const followUps: string[] = Array.isArray(parsed.follow_up_questions)
    ? parsed.follow_up_questions
    : (Array.isArray(parsed.result?.follow_up_questions) ? parsed.result!.follow_up_questions : []);

  const markdown = toMarkdown(parsed);

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>

      {/* Clickable follow-up chips (bonus UX on top of markdown) */}
      {onFollowUpClick && followUps.length > 0 && (
        <div className="biz-followup-chips" style={{ marginTop: "10px" }}>
          {followUps.map((q, i) => (
            <button
              key={i}
              className="biz-followup-chip"
              onClick={() => onFollowUpClick(q)}
              title={q}
            >
              <span className="biz-followup-arrow">→</span> {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
