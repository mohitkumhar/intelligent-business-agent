import { NextResponse } from "next/server";

const AGENT_BASE = (process.env.AGENT_API_URL || "http://localhost:5000").replace(/\/$/, "");

function flushSseBuffer(buffer: string): { events: unknown[]; rest: string } {
  const events: unknown[] = [];
  const lastNl = buffer.lastIndexOf("\n");
  if (lastNl < 0) return { events: [], rest: buffer };
  const complete = buffer.slice(0, lastNl + 1);
  const rest = buffer.slice(lastNl + 1);
  for (const line of complete.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    const payload = t.slice(5).trim();
    if (!payload) continue;
    try {
      events.push(JSON.parse(payload));
    } catch {
      /* ignore */
    }
  }
  return { events, rest };
}

/** Proxies Flask /api/v1/query (SSE) → single JSON for the chat UI. */
export async function POST(req: Request) {
  let body: { conversation_id?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const conversationId = body.conversation_id?.trim();
  const message = body.message?.trim();
  if (!conversationId || !message) {
    return NextResponse.json(
      { error: "conversation_id and message are required", content: "", intent: null },
      { status: 400 },
    );
  }

  const url = `${AGENT_BASE}/api/v1/query?${new URLSearchParams({
    "input-query": message,
    "thread-id": conversationId,
  })}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, { method: "POST", cache: "no-store" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Agent unreachable";
    return NextResponse.json(
      { content: `Error: Could not reach the AI agent (${msg}).`, intent: null },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => upstream.statusText);
    return NextResponse.json(
      { content: `Error: Agent returned ${upstream.status}: ${text.slice(0, 500)}`, intent: null },
      { status: 502 },
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let content = "";
  let intent: string | null = null;
  let sawError: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      const { events, rest } = flushSseBuffer(raw);
      raw = rest;
      for (const ev of events) {
        if (!ev || typeof ev !== "object") continue;
        const o = ev as Record<string, unknown>;
        if (o.type === "token" && typeof o.content === "string") content += o.content;
        if (o.type === "error" && typeof o.error === "string") sawError = o.error;
        if (o.type === "final" && typeof o.intent_str === "string") intent = o.intent_str;
      }
    }
    const { events: tail } = flushSseBuffer(raw + "\n");
    for (const ev of tail) {
      if (!ev || typeof ev !== "object") continue;
      const o = ev as Record<string, unknown>;
      if (o.type === "token" && typeof o.content === "string") content += o.content;
      if (o.type === "error" && typeof o.error === "string") sawError = o.error;
      if (o.type === "final" && typeof o.intent_str === "string") intent = o.intent_str;
    }
  } finally {
    reader.releaseLock();
  }

  const trimmed = content.trim();
  const finalText =
    sawError && !trimmed
      ? `Error: ${sawError}`
      : sawError
        ? `${trimmed}\n\n(Error: ${sawError})`
        : trimmed || "No response from agent.";

  return NextResponse.json({ content: finalText, intent });
}
