/**
 * geminiService
 * -------------
 * Wraps the Google Gemini API for OCR — reading text out of a photographed
 * receipt, invoice or sales ledger.
 *
 * Implemented with plain `fetch` against the REST endpoint rather than the SDK, to
 * keep the dependency list minimal. Node 18+ ships fetch globally.
 */

'use strict';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// gemini-3.6-flash is fast, cheap and vision-capable — a good fit for OCR.
// Verified available 2026-08-22; gemini-2.0-flash has been retired by Google.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 45000);

// Images we accept from the chat channels. Anything else is rejected before we
// spend an API call on it.
const SUPPORTED_MIMETYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// What we actually ask Gemini to do with the image. Note this is a *transcription*
// instruction, not an analysis one — interpretation happens in later stages so that
// each stage has exactly one job.
const OCR_INSTRUCTION = `Transcribe ALL text visible in this image of a business document.

Rules:
- Output the text as literally as possible, preserving line breaks and the order it appears.
- Keep table rows on one line, separating columns with " | ".
- Preserve every digit, currency symbol and date exactly as printed.
- If a character or number is genuinely illegible, write [illegible] in its place
  rather than guessing what it might be.
- Do not summarise, interpret, correct or add anything that is not visibly printed.`;

/**
 * Runs OCR on a base64-encoded image.
 *
 * @param {string} base64Data - raw base64 (a `data:` URI prefix is tolerated and stripped).
 * @param {string} mimetype - e.g. "image/jpeg".
 * @returns {Promise<string>} the transcribed text.
 * @throws {Error} with a `.userMessage` suitable for showing to the end user.
 */
async function extractTextFromImage(base64Data, mimetype) {
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.userMessage = 'Photo reading is not set up yet. Please try sending your question as text.';
    throw err;
  }

  if (!base64Data || typeof base64Data !== 'string') {
    const err = new Error('base64Data missing or not a string');
    err.userMessage = "I couldn't read that image. Could you send it again?";
    throw err;
  }

  const normalizedMime = (mimetype || 'image/jpeg').toLowerCase();
  if (!SUPPORTED_MIMETYPES.has(normalizedMime)) {
    const err = new Error(`Unsupported mimetype: ${normalizedMime}`);
    err.userMessage = `I can read JPG, PNG, WEBP and HEIC photos. That file was ${normalizedMime}.`;
    throw err;
  }

  // Chat clients sometimes hand us a full data URI — strip the prefix if present.
  const cleanBase64 = base64Data.includes(',')
    ? base64Data.slice(base64Data.indexOf(',') + 1)
    : base64Data;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const body = {
    contents: [
      {
        parts: [
          { text: OCR_INSTRUCTION },
          { inline_data: { mime_type: normalizedMime, data: cleanBase64 } },
        ],
      },
    ],
    generationConfig: {
      // Temperature 0: we want faithful transcription, not creative reading.
      temperature: 0,
      maxOutputTokens: 2048,
    },
  };

  // Hard timeout so a hung OCR call can't leave the chat user waiting forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    const err = new Error(`Gemini request failed: ${cause.message}`);
    // AbortError means we hit our own timeout.
    err.userMessage =
      cause.name === 'AbortError'
        ? 'Reading that photo took too long. Could you try a clearer or smaller image?'
        : "I couldn't reach the photo-reading service. Please try again in a moment.";
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(`Gemini HTTP ${response.status}: ${detail.slice(0, 400)}`);
    err.userMessage = "I couldn't read that photo just now. Please try again in a moment.";
    throw err;
  }

  const payload = await response.json();

  // Gemini can return no candidate at all when the image trips a safety filter.
  const parts = payload?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p) => p.text || '').join('').trim()
    : '';

  if (!text) {
    const blockReason =
      payload?.promptFeedback?.blockReason || payload?.candidates?.[0]?.finishReason || 'no text';
    const err = new Error(`Gemini returned no text (${blockReason})`);
    err.userMessage =
      "I couldn't find any readable text in that photo. Could you retake it with better lighting, straight on?";
    throw err;
  }

  return text;
}

module.exports = { extractTextFromImage, SUPPORTED_MIMETYPES };
