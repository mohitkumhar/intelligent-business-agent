/**
 * sessionStore
 * ------------
 * Conversation memory, keyed strictly by sessionId.
 *
 * Isolation is the whole point of this module. Each bot builds a sessionId that
 * includes its channel and the user's own id (e.g. "whatsapp:919926565563@c.us"), and
 * history is only ever read or written under that exact key. There is no global or
 * shared history list anywhere, so one owner's revenue figures can never surface in
 * another owner's reply — even if both are talking to the bot at the same time.
 *
 * Storage is in-memory (a Map). That is deliberate for this stage: it keeps the
 * dependency list minimal and makes the demo trivial to run. The trade-off is that
 * history clears on restart. See the note in README.md on moving to SQLite if
 * conversations need to survive a restart.
 */

'use strict';

// sessionId -> { history: Array<{role, content}>, createdAt: number, lastSeenAt: number }
const sessions = new Map();

// Keep only the most recent N turns. Two reasons: LLM context is finite, and old
// turns actively hurt — stale numbers from ten questions ago get re-quoted as current.
const MAX_HISTORY_TURNS = Number(process.env.MAX_HISTORY_TURNS || 20);

// Drop sessions untouched for this long, so a long-running process doesn't grow
// forever. Sweeping is lazy (on access) to avoid a background timer.
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 24 * 60 * 60 * 1000);

/**
 * Builds a namespaced session id.
 *
 * Including the channel prevents a WhatsApp user and a Telegram user who happen to
 * share a numeric id from colliding.
 *
 * @param {string} channel - "whatsapp" | "telegram" | "api"
 * @param {string} userId - the channel's own id for this user.
 * @returns {string}
 */
function buildSessionId(channel, userId) {
  return `${channel}:${userId}`;
}

/** Removes sessions that have gone stale. Called on each access — no timer needed. */
function sweepExpired() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastSeenAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

/**
 * Returns the history for a session, creating an empty one if needed.
 *
 * @param {string} sessionId
 * @returns {Array<{role: string, content: string}>} a COPY, so callers can't mutate
 *   stored history by accident.
 */
function getHistory(sessionId) {
  if (!sessionId) return [];
  sweepExpired();

  const session = sessions.get(sessionId);
  if (!session) return [];

  session.lastSeenAt = Date.now();
  return [...session.history];
}

/**
 * Appends one user/assistant exchange to a session.
 *
 * @param {string} sessionId
 * @param {string} userMessage
 * @param {string} assistantReply
 */
function appendTurn(sessionId, userMessage, assistantReply) {
  if (!sessionId) return;

  const now = Date.now();
  let session = sessions.get(sessionId);

  if (!session) {
    session = { history: [], createdAt: now, lastSeenAt: now };
    sessions.set(sessionId, session);
  }

  session.history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantReply },
  );

  // Trim from the front, keeping the newest turns. Each turn is 2 entries.
  const maxEntries = MAX_HISTORY_TURNS * 2;
  if (session.history.length > maxEntries) {
    session.history = session.history.slice(-maxEntries);
  }

  session.lastSeenAt = now;
}

/**
 * Wipes a session's history — backs the "/new" command in both bots.
 *
 * @param {string} sessionId
 * @returns {boolean} true if there was anything to clear.
 */
function clearSession(sessionId) {
  if (!sessionId) return false;
  return sessions.delete(sessionId);
}

/**
 * Seeds history from a client-supplied array, but ONLY when the server has none.
 *
 * The /chat and /photo contracts accept a `history` field. The server's own copy is
 * authoritative — otherwise a client could rewrite its past to change an answer.
 * This is the one narrow case where client history is honoured: a fresh server that
 * lost its memory on restart, where the bot still has the thread.
 *
 * @param {string} sessionId
 * @param {Array<{role: string, content: string}>} clientHistory
 * @returns {Array<{role: string, content: string}>} the history to actually use.
 */
function reconcileHistory(sessionId, clientHistory) {
  const serverHistory = getHistory(sessionId);
  if (serverHistory.length > 0) return serverHistory;

  if (!Array.isArray(clientHistory) || clientHistory.length === 0) return [];

  // Accept only well-formed entries, and only the roles we expect.
  const cleaned = clientHistory
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() !== '',
    )
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((m) => ({ role: m.role, content: m.content }));

  return cleaned;
}

/** @returns {{activeSessions: number, totalEntries: number}} for the /health endpoint. */
function stats() {
  sweepExpired();
  let totalEntries = 0;
  for (const session of sessions.values()) totalEntries += session.history.length;
  return { activeSessions: sessions.size, totalEntries };
}

module.exports = {
  buildSessionId,
  getHistory,
  appendTurn,
  clearSession,
  reconcileHistory,
  stats,
  MAX_HISTORY_TURNS,
};
