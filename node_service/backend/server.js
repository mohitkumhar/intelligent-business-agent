/**
 * server.js
 * ---------
 * The core backend. Both chat bots are thin clients over these two endpoints, which
 * is what keeps the AI logic in exactly one place.
 *
 *   POST /chat   { sessionId, message, history }              -> { reply }
 *   POST /photo  { sessionId, mimetype, base64Data, history }  -> { reply }
 *   GET  /health                                               -> service status
 *
 * The photo route is a three-stage pipeline:
 *   1. Gemini reads the image and returns raw text (geminiService)
 *   2. photoToInsightPrompt cleans that into structured fields, marking anything
 *      illegible as "unclear" instead of guessing
 *   3. businessAdvisorPrompt turns the structured data into advice, treating
 *      "unclear" as missing data
 */

'use strict';

// Load .env before anything reads process.env.
require('dotenv').config();

const express = require('express');

const { extractTextFromImage } = require('./services/geminiService');
const aiService = require('./services/aiService');
const sessionStore = require('./services/sessionStore');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Base64 images are bulky — a phone photo can exceed the 100kb default easily.
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '15mb' }));

/** Compact request log, so the flow is visible while presenting. */
app.use((req, _res, next) => {
  if (req.path !== '/health') {
    console.log(`[backend] ${req.method} ${req.path}`);
  }
  next();
});

/**
 * Turns a thrown error into a safe user-facing string.
 * Services attach `.userMessage` for anything the end user should see; everything
 * else falls back to a generic line so internals never leak into a chat reply.
 */
function toUserMessage(err) {
  return err?.userMessage || 'Something went wrong on my side. Please try again in a moment.';
}

// --------------------------------------------------------------------------
// POST /chat — a typed question
// --------------------------------------------------------------------------
app.post('/chat', async (req, res) => {
  const { sessionId, message, history } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    // Server-side history wins; the client's copy is only a fallback after a restart.
    const priorHistory = sessionStore.reconcileHistory(sessionId, history);

    const reply = await aiService.getAdvisorReply(message.trim(), priorHistory);

    // Persist the exchange so the next turn has context.
    sessionStore.appendTurn(sessionId, message.trim(), reply);

    return res.json({ reply });
  } catch (err) {
    console.error(`[backend] /chat failed for ${sessionId}:`, err.message);
    return res.status(502).json({ error: toUserMessage(err) });
  }
});

// --------------------------------------------------------------------------
// POST /photo — an uploaded image of a business record
// --------------------------------------------------------------------------
app.post('/photo', async (req, res) => {
  const { sessionId, mimetype, base64Data, history } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (!base64Data || typeof base64Data !== 'string') {
    return res.status(400).json({ error: 'base64Data is required' });
  }

  try {
    const priorHistory = sessionStore.reconcileHistory(sessionId, history);

    // Stage 1 — OCR. Raw, messy, faithful transcription.
    console.log(`[backend] OCR starting for ${sessionId} (${mimetype || 'image/jpeg'})`);
    const rawOcrText = await extractTextFromImage(base64Data, mimetype);
    console.log(`[backend] OCR returned ${rawOcrText.length} chars`);

    // Stage 2 — structure it, preserving "unclear" markers rather than guessing.
    const structuredData = await aiService.structureOcrText(rawOcrText);

    // Stage 3 — advise on the structured data under the no-hallucination rules.
    const reply = await aiService.getPhotoAdvisorReply(structuredData, priorHistory);

    // Record a readable placeholder for the user turn, so later turns know a
    // document was shared without re-embedding the whole image.
    sessionStore.appendTurn(sessionId, '[Uploaded a photo of a business record]', reply);

    return res.json({ reply });
  } catch (err) {
    console.error(`[backend] /photo failed for ${sessionId}:`, err.message);
    return res.status(502).json({ error: toUserMessage(err) });
  }
});

// --------------------------------------------------------------------------
// POST /session/reset — backs the "/new" command in both bots
// --------------------------------------------------------------------------
app.post('/session/reset', (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  const existed = sessionStore.clearSession(sessionId);
  return res.json({ cleared: existed });
});

// --------------------------------------------------------------------------
// GET /health — config sanity check without exposing secret values
// --------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: aiService.OPENROUTER_MODEL,
    // Booleans only: confirms a key is present without ever printing it.
    openrouterKey: Boolean(process.env.OPENROUTER_API_KEY),
    geminiKey: Boolean(process.env.GEMINI_API_KEY),
    sessions: sessionStore.stats(),
  });
});

// Start only when run directly, so tests can require the app without binding a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[backend] listening on http://localhost:${PORT}`);
    console.log(`[backend] advisor model: ${aiService.OPENROUTER_MODEL}`);
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('[backend] WARNING: OPENROUTER_API_KEY is not set — /chat will fail.');
    }
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[backend] WARNING: GEMINI_API_KEY is not set — /photo will fail.');
    }
  });
}

module.exports = app;
