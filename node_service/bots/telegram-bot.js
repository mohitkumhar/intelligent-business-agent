/**
 * telegram-bot.js
 * ---------------
 * Telegram channel for the AI Business Helper, via the official Bot API.
 *
 * Feature parity with the WhatsApp bot is deliberate, and it comes for free: both
 * bots call the same /chat and /photo endpoints, so there is no duplicated AI logic
 * and no risk of the two channels giving different answers to the same question.
 *
 * Access control — DISCOVERY MODE:
 * Telegram identifies users by a numeric chat.id, not a phone number, so you cannot
 * know the id in advance. Leave TELEGRAM_ALLOWED_CHAT_IDS empty and the bot runs in
 * discovery mode: it logs the chat.id of everyone who messages it and replies to
 * nobody. Message the bot once from your own account, copy the id from the console
 * into .env, restart, and it will then answer only you.
 */

'use strict';

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Comma-separated numeric chat ids. Empty => discovery mode (see header).
const ALLOWED_CHAT_IDS = new Set(
  (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const DISCOVERY_MODE = ALLOWED_CHAT_IDS.size === 0;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('[telegram] TELEGRAM_BOT_TOKEN is not set. Add it to .env and restart.');
  process.exit(1);
}

// Tracks the current sessionId per chat, so "/new" can rotate it.
const activeSessions = new Map();

/** Returns the sessionId for a chat, creating one on first contact. */
function getSessionId(chatId) {
  if (!activeSessions.has(chatId)) {
    activeSessions.set(chatId, `telegram:${chatId}`);
  }
  return activeSessions.get(chatId);
}

/** Rotates a chat's sessionId and clears the old history server-side. */
async function resetSession(chatId) {
  const oldSessionId = getSessionId(chatId);

  try {
    await fetch(`${BACKEND_URL}/session/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: oldSessionId }),
    });
  } catch (err) {
    console.error(`[telegram] session reset call failed: ${err.message}`);
  }

  const fresh = `telegram:${chatId}:${Date.now()}`;
  activeSessions.set(chatId, fresh);
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
    throw new Error(data.error || `Backend returned HTTP ${response.status}`);
  }
  if (!data.reply) {
    throw new Error('Backend returned no reply');
  }
  return data.reply;
}

/**
 * The access-control gate. Returns true when this chat may be served.
 * In discovery mode nothing is served — the id is only logged.
 */
function isAuthorised(chatId, from) {
  const id = String(chatId);

  if (DISCOVERY_MODE) {
    console.log(
      `[telegram] DISCOVERY MODE — chat.id=${id} ` +
        `(from: ${from?.username ? '@' + from.username : from?.first_name || 'unknown'})`,
    );
    console.log(`[telegram] To authorise this user, set TELEGRAM_ALLOWED_CHAT_IDS=${id} in .env and restart.`);
    return false;
  }

  if (!ALLOWED_CHAT_IDS.has(id)) {
    console.log(`[telegram] IGNORED message from unauthorised chat.id=${id}`);
    return false;
  }
  return true;
}

// Polling avoids needing a public HTTPS webhook, which makes local dev far simpler.
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log('[telegram] bot started (polling)');
console.log(`[telegram] backend: ${BACKEND_URL}`);
if (DISCOVERY_MODE) {
  console.log('[telegram] DISCOVERY MODE ACTIVE — logging chat ids, replying to nobody.');
  console.log('[telegram] Send the bot a message, then copy the logged id into TELEGRAM_ALLOWED_CHAT_IDS.');
} else {
  console.log(`[telegram] replying only to chat ids: ${[...ALLOWED_CHAT_IDS].join(', ')}`);
}

// --------------------------------------------------------------------------
// "/new" — reset the conversation
// --------------------------------------------------------------------------
// Registered before the generic text handler so it wins for this command.
bot.onText(/^\/new$/i, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorised(chatId, msg.from)) return;

  try {
    await resetSession(chatId);
    await bot.sendMessage(chatId, '🆕 Fresh start. Your previous conversation has been cleared.');
    console.log(`[telegram] session reset for ${chatId}`);
  } catch (err) {
    console.error(`[telegram] /new failed: ${err.message}`);
  }
});

// --------------------------------------------------------------------------
// /start — a short greeting so the bot isn't silent on first contact
// --------------------------------------------------------------------------
bot.onText(/^\/start$/i, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorised(chatId, msg.from)) return;

  await bot.sendMessage(
    chatId,
    [
      '👋 I am your AI Business Helper.',
      '',
      'Ask me about a business decision — spending, hiring, pricing, cash — and I will',
      'answer using only the numbers you give me.',
      '',
      'You can also send a photo of a bill, invoice or sales record and I will read it.',
      '',
      'Send /new any time to start a fresh conversation.',
    ].join('\n'),
  );
});

// --------------------------------------------------------------------------
// Photo messages
// --------------------------------------------------------------------------
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorised(chatId, msg.from)) return;

  const sessionId = getSessionId(chatId);

  try {
    // Telegram sends several sizes; the last entry is the highest resolution,
    // which gives OCR the best chance.
    const largest = msg.photo[msg.photo.length - 1];

    // Acknowledge immediately — OCR takes a few seconds.
    await bot.sendMessage(chatId, '📷 Got your photo, reading it now...');

    // Download the file into memory and base64-encode it for the backend.
    const buffer = await bot.getFileStream(largest.file_id).then(streamToBuffer);
    const base64Data = buffer.toString('base64');

    const reply = await callBackend('/photo', {
      sessionId,
      // Telegram re-encodes photos as JPEG.
      mimetype: 'image/jpeg',
      base64Data,
    });

    await bot.sendMessage(chatId, reply);
    console.log(`[telegram] photo answered for ${chatId}`);
  } catch (err) {
    console.error(`[telegram] photo handling failed for ${chatId}:`, err.message);
    await bot
      .sendMessage(chatId, `⚠️ ${err.message}`)
      .catch((e) => console.error(`[telegram] could not deliver error reply: ${e.message}`));
  }
});

// --------------------------------------------------------------------------
// Plain text messages
// --------------------------------------------------------------------------
bot.on('message', async (msg) => {
  // Skip anything the dedicated handlers above already own.
  if (msg.photo) return;
  if (!msg.text) return;
  if (/^\/(new|start)$/i.test(msg.text.trim())) return;

  const chatId = msg.chat.id;
  if (!isAuthorised(chatId, msg.from)) return;

  const sessionId = getSessionId(chatId);

  try {
    // Typing indicator gives useful feedback while the LLM thinks.
    await bot.sendChatAction(chatId, 'typing');

    const reply = await callBackend('/chat', { sessionId, message: msg.text.trim() });
    await bot.sendMessage(chatId, reply);
    console.log(`[telegram] text answered for ${chatId}`);
  } catch (err) {
    console.error(`[telegram] text handling failed for ${chatId}:`, err.message);
    await bot
      .sendMessage(chatId, `⚠️ ${err.message}`)
      .catch((e) => console.error(`[telegram] could not deliver error reply: ${e.message}`));
  }
});

/** Collects a readable stream into a single Buffer. */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

bot.on('polling_error', (err) => console.error(`[telegram] polling error: ${err.message}`));

process.on('unhandledRejection', (reason) => {
  console.error('[telegram] unhandled rejection:', reason);
});
