/**
 * aiService
 * ---------
 * The single place where the core LLM is called.
 *
 * Provider: OpenRouter, which speaks the OpenAI chat-completions format but can route
 * to Claude models. This reuses the OPENROUTER_API_KEY already in the project and lets
 * the model be swapped with one env var (OPENROUTER_MODEL) — no code change.
 *
 * Both chat bots go through this module, so there is exactly one copy of the AI logic
 * and WhatsApp and Telegram can never drift apart.
 */

'use strict';

const {
  buildAdvisorMessages,
  buildPhotoAdvisorMessages,
} = require('../prompts/businessAdvisorPrompt');
const { buildPhotoToInsightMessages } = require('../prompts/photoToInsightPrompt');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 60000);

/**
 * Low-level call to the LLM.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {{temperature?: number, maxTokens?: number}} [options]
 * @returns {Promise<string>} the assistant's reply text.
 * @throws {Error} with a `.userMessage` safe to show the end user.
 */
async function callLLM(messages, options = {}) {
  if (!OPENROUTER_API_KEY) {
    const err = new Error('OPENROUTER_API_KEY is not configured');
    err.userMessage = 'The advisor is not configured yet. Please check the server setup.';
    throw err;
  }

  const body = {
    model: OPENROUTER_MODEL,
    messages,
    // Temperature 0 keeps the numbers stable: the same question over the same data
    // should not produce a different figure on a second try.
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 1200,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        // OpenRouter uses these two for attribution on their dashboard.
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_SITE_NAME || 'AI Business Helper',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    const err = new Error(`LLM request failed: ${cause.message}`);
    err.userMessage =
      cause.name === 'AbortError'
        ? 'That took longer than expected. Could you ask me again?'
        : "I couldn't reach the advisor service. Please try again in a moment.";
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(`LLM HTTP ${response.status}: ${detail.slice(0, 400)}`);
    // 429 is worth its own message — the user can meaningfully act on "wait".
    err.userMessage =
      response.status === 429
        ? "I'm getting a lot of requests right now. Please try again in a minute."
        : "I couldn't work that out just now. Please try again in a moment.";
    throw err;
  }

  const payload = await response.json();
  const reply = payload?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    const err = new Error('LLM returned an empty reply');
    err.userMessage = "I couldn't produce an answer for that. Could you rephrase it?";
    throw err;
  }

  return reply;
}

/**
 * Stage A of the photo flow: messy OCR text -> clean structured fields.
 *
 * Kept separate from the advisor call so that "unclear" markings survive into the
 * advisor stage instead of being quietly resolved into invented numbers.
 *
 * @param {string} rawOcrText
 * @returns {Promise<string>} structured document data.
 */
async function structureOcrText(rawOcrText) {
  return callLLM(buildPhotoToInsightMessages(rawOcrText), { maxTokens: 1500 });
}

/**
 * A normal typed chat turn.
 *
 * @param {string} message - what the owner typed.
 * @param {Array<{role: string, content: string}>} history - this session's prior turns.
 * @returns {Promise<string>} the advisor's reply.
 */
async function getAdvisorReply(message, history = []) {
  return callLLM(buildAdvisorMessages(message, history));
}

/**
 * Stage B of the photo flow: structured document data -> business advice.
 *
 * @param {string} structuredData - output of structureOcrText.
 * @param {Array<{role: string, content: string}>} history - this session's prior turns.
 * @returns {Promise<string>} the advisor's reply.
 */
async function getPhotoAdvisorReply(structuredData, history = []) {
  return callLLM(buildPhotoAdvisorMessages(structuredData, history));
}

module.exports = {
  callLLM,
  structureOcrText,
  getAdvisorReply,
  getPhotoAdvisorReply,
  OPENROUTER_MODEL,
};
