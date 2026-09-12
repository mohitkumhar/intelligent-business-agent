import os
import json
import time
import base64
import requests
from datetime import datetime
from logger.logger import logger

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


def _call_gemini_ocr(image_base64: str, mime_type: str, prompt: str) -> str:
    """Try working Gemini models in sequence with quick 15s timeout and fast fallback."""
    if not GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json"
        },
    }
    headers = {"Content-Type": "application/json"}

    last_err = None
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            logger.info(f"Calling Gemini OCR with {model}...")
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            if response.status_code == 200:
                resp_json = response.json()
                if "candidates" in resp_json and len(resp_json["candidates"]) > 0:
                    candidate = resp_json["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        return candidate["content"]["parts"][0]["text"]
            else:
                logger.warning(f"{model} returned HTTP {response.status_code}: {response.text[:150]}")
        except Exception as e:
            logger.warning(f"Error calling {model}: {e}")
            last_err = e

    raise last_err or ValueError("Gemini OCR was temporarily unavailable. Please try again.")


def _call_openrouter_ocr(image_base64: str, mime_type: str, prompt: str) -> str:
    """Fallback to OpenRouter vision if Gemini is unavailable."""
    if not OPENROUTER_API_KEY:
        raise ValueError("Missing OPENROUTER_API_KEY")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
                    },
                ],
            }
        ],
        "response_format": {"type": "json_object"},
    }
    logger.info("Falling back to OpenRouter vision model...")
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    resp_json = response.json()
    return resp_json["choices"][0]["message"]["content"]


def extract_transactions_from_image(image_bytes: bytes, filename: str) -> list[tuple]:
    """
    Extract handwritten ledger entries and format them as transactions.
    Returns: list of (transaction_date, type, category, amount, description)
    """
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    
    ext = os.path.splitext(filename)[1].lower()
    mime_type = "image/jpeg"
    if ext == ".png":
        mime_type = "image/png"
    elif ext == ".webp":
        mime_type = "image/webp"

    today_str = datetime.now().strftime("%Y-%m-%d")
    current_year = datetime.now().year

    prompt = f"""
    Extract all transaction data from this handwritten ledger, receipt, or notebook image. 
    Format the output as a JSON list of objects.
    Each object must have:
    - "date": Date in YYYY-MM-DD format. If NO date is explicitly written in the image, you MUST use today's date ({today_str}). If only day/month is mentioned, use the current year ({current_year}).
    - "type": "Revenue" for sales/income or "Expense" for costs/payments/purchases. Default to "Revenue" for customer orders / product item lists.
    - "category": Short category (e.g., Sales, Inventory, Electronics, General).
    - "amount": Total numerical amount (e.g. 15000, 100, 50). Do not include commas or currency symbols.
    - "description": Brief description of the transaction (e.g. "10 Cables", "5 Bottles", "1 Mobile").

    Respond ONLY with the JSON array. No preamble or markdown code blocks.
    Example: 
    [
      {{"date": "{today_str}", "type": "Revenue", "category": "Sales", "amount": 100, "description": "10 Cables"}},
      {{"date": "{today_str}", "type": "Revenue", "category": "Sales", "amount": 50, "description": "5 Bottles"}},
      {{"date": "{today_str}", "type": "Revenue", "category": "Sales", "amount": 15000, "description": "1 Mobile"}}
    ]
    """

    text_result = None
    try:
        text_result = _call_gemini_ocr(image_base64, mime_type, prompt)
    except Exception as gemini_err:
        logger.warning(f"Gemini OCR failed: {gemini_err}. Trying OpenRouter fallback...")
        try:
            text_result = _call_openrouter_ocr(image_base64, mime_type, prompt)
        except Exception as openrouter_err:
            logger.error(f"Both Gemini and OpenRouter OCR failed: {openrouter_err}")
            raise ValueError("AI Vision service is temporarily unavailable. Please try again.")

    if not text_result:
        raise ValueError("Could not extract text from the image.")

    logger.info("Successfully received OCR response: %s", text_result)

    # Clean markdown if present
    if "```" in text_result:
        cleaned = text_result.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        text_result = cleaned.strip()

    data = json.loads(text_result)
    if not isinstance(data, list):
        if isinstance(data, dict) and "transactions" in data:
            data = data["transactions"]
        elif isinstance(data, dict):
            # Sometimes JSON object returned with a list value
            for v in data.values():
                if isinstance(v, list):
                    data = v
                    break

    if not isinstance(data, list) or not data:
        raise ValueError("No valid transaction entries found in this image.")

    today_date = datetime.now().date()
    transactions = []
    for idx, item in enumerate(data):
        try:
            raw_date = item.get("date")
            d = None
            if isinstance(raw_date, str) and raw_date.strip():
                raw_date_str = raw_date.strip()
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
                    try:
                        d = datetime.strptime(raw_date_str[:10], fmt).date()
                        break
                    except ValueError:
                        continue
            if not d:
                d = today_date

            t = str(item.get("type", "Revenue")).strip().capitalize()
            if t not in ("Revenue", "Expense"):
                t = "Revenue"

            c = str(item.get("category", "Sales")).strip()[:100] or "Sales"

            raw_amount = item.get("amount", 0)
            if isinstance(raw_amount, str):
                raw_amount = raw_amount.replace(",", "").replace("₹", "").replace("$", "").strip()
            a = float(raw_amount or 0)

            desc = str(item.get("description", c)).strip()[:500] or c

            transactions.append((d, t, c, a, desc))
        except Exception as e:
            logger.warning(f"Skipping row {idx} due to parsing error: {e}")
            continue

    if not transactions:
        raise ValueError("Found entries, but none were valid transaction formats.")

    return transactions