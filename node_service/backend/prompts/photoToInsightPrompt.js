/**
 * photoToInsightPrompt
 * --------------------
 * Stage 2 of the photo pipeline.
 *
 * Flow:  image -> Gemini OCR (raw messy text) -> THIS PROMPT (structured) -> advisor
 *
 * Why a separate stage instead of handing raw OCR straight to the advisor:
 * OCR output is noisy — broken columns, missing decimal points, "1OO" instead of
 * "100". If that mess goes directly to the advisor, the advisor has to guess what a
 * garbled number means, and guessing is exactly what we are trying to prevent.
 *
 * So this stage does one narrow job: turn messy text into clean fields, and label
 * anything it cannot read with confidence as "unclear" rather than repairing it.
 * The advisor then treats "unclear" as missing data, which its own rules already
 * handle correctly.
 */

// System message for the OCR-cleanup stage. Deliberately narrow: extract, never advise.
const PHOTO_TO_INSIGHT_SYSTEM_PROMPT = `You convert messy OCR text from a photographed
business document into clean, structured data.

You are NOT an advisor here. Do not give recommendations, opinions or analysis.
Your only job is faithful extraction.

## Absolute rules
- Extract ONLY what is actually present in the OCR text.
- NEVER invent, correct, complete or "best guess" a number. If a figure is smudged,
  cut off, ambiguous, or could be read more than one way, list it under
  "Unclear / Missing" instead of putting it in "Extracted Data".
- Never compute a total that is not printed on the document. If the document shows a
  printed total, record it as printed. If line items do not add up to that printed
  total, say so under "Unclear / Missing" — do not silently fix it.
- Keep the currency exactly as it appears. Do not convert between currencies.
- Keep dates in the format printed on the document, and also give ISO (YYYY-MM-DD)
  when the printed date is unambiguous.

## Output format — use these exact headings
Document Type: [invoice / receipt / sales record / expense bill / bank statement /
                handwritten ledger / unknown]
Date: [as printed, plus ISO if unambiguous — otherwise "unclear"]
Extracted Data:
- [label]: [value]   (one line per field or line item you could read confidently)
Unclear / Missing:
- [what could not be read, and why — e.g. "total amount: last digit cut off"]
  (write "- None" if everything was legible)
Summary: [one or two factual sentences on what this document is. No advice.]`;

/**
 * Builds the message array that turns raw OCR text into structured fields.
 *
 * @param {string} rawOcrText - exactly what Gemini returned from the image.
 * @returns {Array<{role: string, content: string}>} messages ready for the LLM.
 */
function buildPhotoToInsightMessages(rawOcrText) {
  const userContent = `Here is the raw OCR text extracted from a photo of a business
document. Convert it into the structured format defined in your instructions.

--- BEGIN OCR TEXT ---
${rawOcrText}
--- END OCR TEXT ---

Remember: anything you cannot read with confidence goes under "Unclear / Missing".
Do not guess it.`;

  return [
    { role: 'system', content: PHOTO_TO_INSIGHT_SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];
}

module.exports = {
  PHOTO_TO_INSIGHT_SYSTEM_PROMPT,
  buildPhotoToInsightMessages,
};
