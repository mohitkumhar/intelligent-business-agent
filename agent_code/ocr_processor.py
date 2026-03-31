import os
import json
import base64
import requests
from datetime import datetime
from logger.logger import logger

# Try to get API KEY from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def extract_transactions_from_image(image_bytes: bytes, filename: str) -> list[tuple]:
    """
    Use Gemini Vision API to extract handwritten ledger entries and format them as transactions.
    Returns: list of (transaction_date, type, category, amount, description)
    """
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not found in environment. OCR extraction failed.")
        raise ValueError("Missing GEMINI_API_KEY for handwriting extraction.")

    # Encode image to base64
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    
    # MIME type detection
    ext = os.path.splitext(filename)[1].lower()
    mime_type = "image/jpeg"
    if ext == ".png":
        mime_type = "image/png"
    elif ext == ".webp":
        mime_type = "image/webp"

    # Gemini Vision API Endpoint (Generative Language API)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

    prompt = """
    Extract all transaction data from this handwritten ledger or receipt image. 
    Format the output as a JSON list of objects.
    Each object must have:
    - "date": Date in YYYY-MM-DD format. If only day/month is mentioned, use the current year (2026).
    - "type": "Revenue" for income/sales or "Expense" for costs/payments.
    - "category": Short category (e.g., Sales, Rent, Inventory, Food, Transport).
    - "amount": Numerical value (no currency symbols).
    - "description": Brief description of the transaction.

    Respond ONLY with the JSON array. No preamble or markdown code blocks.
    Example: 
    [
      {"date": "2026-03-01", "type": "Revenue", "category": "Sales", "amount": 1500, "description": "Cash sale"},
      {"date": "2026-03-02", "type": "Expense", "category": "Rent", "amount": 500, "description": "Shop rent"}
    ]
    """

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }

    headers = {"Content-Type": "application/json"}

    try:
        logger.info(f"Sending image OCR request to Gemini for {filename}...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        resp_json = response.json()
        
        # Parse text from Gemini response
        if "candidates" in resp_json and len(resp_json["candidates"]) > 0:
            text_result = resp_json["candidates"][0]["content"]["parts"][0]["text"]
            logger.info("Successfully received OCR response from Gemini.")
            
            # Use JSON parsing
            try:
                data = json.loads(text_result)
                if not isinstance(data, list):
                    # Sometimes LLMs wrap in an object
                    if "transactions" in data:
                        data = data["transactions"]
                    else:
                        raise ValueError("Unexpected JSON structure from Gemini")
                
                # Convert to the list of tuples expected by the database insert logic
                transactions = []
                for item in data:
                    try:
                        d = datetime.strptime(item.get("date", ""), "%Y-%m-%d").date()
                        t = str(item.get("type", "Revenue")).capitalize()
                        if t not in ("Revenue", "Expense"):
                            t = "Revenue"
                        c = str(item.get("category", "General"))[:100]
                        a = float(item.get("amount", 0))
                        desc = str(item.get("description", c))[:500]
                        
                        transactions.append((d, t, c, a, desc))
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Skipping malformed row: {item} - {e}")
                        continue
                
                return transactions
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini JSON output: {text_result}")
                raise ValueError("AI could not extract structured data. Please try a clearer image.")
        else:
            logger.error(f"Empty response from Gemini: {resp_json}")
            raise ValueError("No data returned from AI extraction.")

    except Exception as e:
        logger.error(f"Error during Gemini OCR processing: {str(e)}", exc_info=True)
        raise e
