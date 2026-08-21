/**
 * whatsapp-bot.js
 * ---------------
 * WhatsApp channel for the AI Business Helper, via whatsapp-web.js.
 *
 * How it works: whatsapp-web.js drives a real WhatsApp Web session in headless
 * Chromium. You link it once by scanning a QR code with the phone that hosts the bot
 * account (WHATSAPP_BOT_NUMBER). LocalAuth then caches the session to disk, so
 * restarts do not need a fresh scan.
 *
 * Access control: this bot replies ONLY to the numbers in WHATSAPP_ALLOWED_IDS.
 * Every other sender is logged and dropped — no reply, and no backend call, so an
 * unknown number can never spend an API credit.
 *
 * All AI work happens in the backend (/chat, /photo). This file is transport only.
 */

'use strict';

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// The number whose WhatsApp is QR-linked to run this bot. Display/logging only —
// whatsapp-web.js learns the real identity from the linked session.
const BOT_NUMBER = process.env.WHATSAPP_BOT_NUMBER || '(not set)';

// Comma-separated WhatsApp IDs allowed to talk to the bot, e.g.
// "919926565563@c.us". Anything not on this list is ignored.
const ALLOWED_IDS = new Set(
  (process.env.WHATSAPP_ALLOWED_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

// Where LocalAuth caches the linked session between restarts.
const SESSION_PATH = process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth';

// Tracks the current sessionId per sender, so "/new" can rotate it.
const activeSessions = new Map();

/**
 * Returns the sessionId for a sender, creating one on first contact.
 * The id is namespaced by channel so it can never collide with a Telegram session.
 */
function getSessionId(senderId) {
  if (!activeSessions.has(senderId)) {
    activeSessions.set(senderId, `whatsapp:${senderId}`);
  }
  return activeSessions.get(senderId);
}

/**
 * Rotates a sender's sessionId and clears the old history server-side.
 * Rotating the id (rather than only clearing) guarantees a clean slate even if the
 * reset call fails.
 */
async function resetSession(senderId) {
  const oldSessionId = getSessionId(senderId);

  try {
    await fetch(`${BACKEND_URL}/session/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: oldSessionId }),
    });
  } catch (err) {
    console.error(`[whatsapp] session reset call failed: ${err.message}`);
  }

  // A timestamp suffix makes the new session distinct from the old one.
  const fresh = `whatsapp:${senderId}:${Date.now()}`;
  activeSessions.set(senderId, fresh);
  return fresh;
}

/** POSTs to a backend endpoint and returns the reply text. */
async function callBackend(path, payload) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // The backend already phrases errors for end users; surface that text.
    throw new Error(data.error || `Backend returned HTTP ${response.status}`);
  }
  if (!data.reply) {
    throw new Error('Backend returned no reply');
  }
  return data.reply;
}

// --------------------------------------------------------------------------
// Client setup
// --------------------------------------------------------------------------
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
  puppeteer: {
    headless: true,
    // Standard flags for running Chromium in containers / CI.
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// Printed once on first run (or after the cached session expires).
client.on('qr', (qr) => {
  console.log('\n[whatsapp] Scan this QR with the bot phone (%s):\n', BOT_NUMBER);
  qrcode.generate(qr, { small: true });
  console.log('\n[whatsapp] WhatsApp > Settings > Linked devices > Link a device\n');
});

client.on('authenticated', () => console.log('[whatsapp] authenticated — session cached'));
client.on('auth_failure', (msg) => console.error(`[whatsapp] auth failure: ${msg}`));

client.on('ready', () => {
  console.log('[whatsapp] client ready');
  console.log(`[whatsapp] bot number : ${BOT_NUMBER}`);
  console.log(`[whatsapp] backend    : ${BACKEND_URL}`);

  if (ALLOWED_IDS.size === 0) {
    // Fail loud rather than quietly replying to the whole world.
    console.warn('[whatsapp] WARNING: WHATSAPP_ALLOWED_IDS is empty — every message will be ignored.');
  } else {
    console.log(`[whatsapp] replying only to: ${[...ALLOWED_IDS].join(', ')}`);
  }
});

client.on('disconnected', (reason) => console.warn(`[whatsapp] disconnected: ${reason}`));

// --------------------------------------------------------------------------
// Message handler
// --------------------------------------------------------------------------
client.on('message', async (message) => {
  const senderId = message.from;

  // Ignore group chats and status broadcasts outright.
  if (senderId.endsWith('@g.us') || senderId === 'status@broadcast') return;

  // --- Access control gate ------------------------------------------------
  // Log for visibility, then drop. No reply, no backend call.
  if (!ALLOWED_IDS.has(senderId)) {
    console.log(`[whatsapp] IGNORED message from unauthorised number: ${senderId}`);
    return;
  }

  const sessionId = getSessionId(senderId);
  const bodyText = (message.body || '').trim();

  try {
    // --- "/new" or "new chat": start a fresh conversation -----------------
    if (/^(\/new|new chat)$/i.test(bodyText)) {
      await resetSession(senderId);
      await message.reply('🆕 Fresh start. Your previous conversation has been cleared.');
      console.log(`[whatsapp] session reset for ${senderId}`);
      return;
    }

    // --- Image message ---------------------------------------------------
    if (message.hasMedia) {
      const media = await message.downloadMedia();

      if (!media || !media.mimetype?.startsWith('image/')) {
        await message.reply(
          "I can read photos of bills, invoices and sales records. That attachment wasn't an image — could you send a photo instead?",
        );
        return;
      }

      // OCR takes a few seconds, so acknowledge immediately.
      await message.reply('📷 Got your photo, reading it now...');

      const reply = await callBackend('/photo', {
        sessionId,
        mimetype: media.mimetype,
        base64Data: media.data,
      });

      await message.reply(reply);
      console.log(`[whatsapp] photo answered for ${senderId}`);
      return;
    }

    // --- Plain text message ----------------------------------------------
    if (!bodyText) return;

    const reply = await callBackend('/chat', { sessionId, message: bodyText });
    await message.reply(reply);
    console.log(`[whatsapp] text answered for ${senderId}`);
  } catch (err) {
    // Never crash and never go silent — the owner always gets something back.
    console.error(`[whatsapp] error handling message from ${senderId}:`, err.message);
    try {
      await message.reply(`⚠️ ${err.message}`);
    } catch (replyErr) {
      console.error(`[whatsapp] could not deliver error reply: ${replyErr.message}`);
    }
  }
});

// Keep the process alive on unexpected failures rather than dying mid-conversation.
process.on('unhandledRejection', (reason) => {
  console.error('[whatsapp] unhandled rejection:', reason);
});

console.log('[whatsapp] starting client — this can take a few seconds...');
client.initialize();
