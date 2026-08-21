# AI Business Helper — Node Backend + WhatsApp & Telegram Bots

An AI chatbot that helps small business owners make decisions. Owners chat on
**WhatsApp** or **Telegram**, either by typing a question or by photographing a bill,
invoice or sales record. The photo is read by **Gemini**, cleaned into structured
fields, and analysed by a strict no-hallucination business advisor prompt.

## Architecture

```
WhatsApp  ─┐                        ┌─ POST /chat  ──► businessAdvisorPrompt ──► OpenRouter (Claude)
           ├──► Node backend  ──────┤
Telegram  ─┘   (Express, :3000)     └─ POST /photo ──► Gemini OCR
                                                        └─► photoToInsightPrompt
                                                              └─► businessAdvisorPrompt
```

Both bots are **transport only** — they hold no AI logic. Every prompt and model call
lives in the backend, so the two channels can never drift apart or give different
answers to the same question.

### The photo pipeline, and why it has three stages

1. **Gemini OCR** transcribes the image literally, marking illegible characters
   `[illegible]` rather than guessing.
2. **`photoToInsightPrompt`** turns that mess into clean fields, and anything it
   cannot read with confidence goes under **"Unclear / Missing"** instead of being
   repaired.
3. **`businessAdvisorPrompt`** advises on the structured data, treating "unclear" as
   missing — so it asks the owner for the figure instead of inventing it.

Collapsing stages 2 and 3 is what causes hallucinated totals: the advisor would be
forced to interpret `1OO` or a cut-off digit on its own. Keeping them apart means each
stage has exactly one job.

## Project structure

```
node_service/
├── backend/
│   ├── server.js                      Express app: /chat, /photo, /session/reset, /health
│   ├── prompts/
│   │   ├── businessAdvisorPrompt.js   The no-hallucination advisor contract + output templates
│   │   └── photoToInsightPrompt.js    OCR cleanup: structure it, never guess it
│   └── services/
│       ├── geminiService.js           Gemini vision OCR (plain fetch, no SDK)
│       ├── aiService.js               OpenRouter/Claude calls — the only LLM caller
│       └── sessionStore.js            Per-session history, isolated by channel + user
├── bots/
│   ├── whatsapp-bot.js                whatsapp-web.js, QR login, single-number allowlist
│   └── telegram-bot.js                node-telegram-bot-api, polling, discovery mode
├── .env.example
└── package.json
```

## Setup

```bash
cd node_service
npm install
cp .env.example .env
# then edit .env and fill in OPENROUTER_API_KEY and GEMINI_API_KEY
```

> `npm install` pulls Puppeteer (a bundled Chromium, ~176 MB zip / 338 MB extracted)
> because whatsapp-web.js drives a real WhatsApp Web session. Expected, and only once.

### If the WhatsApp bot fails to launch Chromium

Two things went wrong on this machine, and both are likely to recur on a fresh clone:

**1. npm 11 blocks install scripts by default**, so Puppeteer's postinstall never
downloads Chromium. You'll see `npm warn install-scripts ... puppeteer (postinstall)`.
Fix:

```bash
npx puppeteer browsers install chrome
```

**2. Puppeteer's own extraction can silently fail**, leaving a stub app bundle — the
symptom is `dlopen ... Google Chrome for Testing Framework (no such file)`. Check it:

```bash
du -sh ~/.cache/puppeteer/chrome/mac_arm-*/
# ~448K means extraction failed; a good install is ~338M
```

Fix by extracting the downloaded zip yourself with `ditto`, which handles `.app`
bundles correctly:

```bash
cd ~/.cache/puppeteer/chrome
rm -rf mac_arm-<version>
mkdir -p mac_arm-<version>
ditto -x -k <version>-chrome-mac-arm64.zip mac_arm-<version>
```

Verify before starting the bot:

```bash
node -e "const p=require('puppeteer'),fs=require('fs');console.log(fs.existsSync(p.executablePath()))"
# must print true
```

### Required keys

| Variable | Where to get it |
|---|---|
| `OPENROUTER_API_KEY` | <https://openrouter.ai/keys> |
| `GEMINI_API_KEY` | <https://aistudio.google.com/app/apikey> |
| `TELEGRAM_BOT_TOKEN` | `@BotFather` on Telegram |

## Running it

Three terminals — the backend must be up before either bot.

**1. Backend**

```bash
npm run backend
# [backend] listening on http://localhost:3000
# [backend] advisor model: anthropic/claude-sonnet-5
```

Check it: `curl http://localhost:3000/health` — confirms both API keys are detected
(as booleans; values are never printed).

**2. WhatsApp bot**

```bash
npm run whatsapp
```

On first run a **QR code prints in the terminal**. On the bot phone
(`7976127452`): **WhatsApp → Settings → Linked devices → Link a device**, then scan.
LocalAuth caches the session under `.wwebjs_auth/`, so restarts skip the scan. Delete
that folder to force a fresh login.

The bot replies **only** to the numbers in `WHATSAPP_ALLOWED_IDS` (default
`919926565563@c.us`). Every other sender is logged and dropped — no reply, and no
backend call, so an unknown number cannot spend an API credit.

**3. Telegram bot**

```bash
npm run telegram
```

*Finding your chat id.* Telegram identifies users by a numeric `chat.id`, which you
cannot know in advance. So leave `TELEGRAM_ALLOWED_CHAT_IDS` **empty** on first run
and the bot starts in **discovery mode** — it logs the id of anyone who messages it
and replies to nobody:

```
[telegram] DISCOVERY MODE — chat.id=123456789 (from: @yourname)
[telegram] To authorise this user, set TELEGRAM_ALLOWED_CHAT_IDS=123456789 in .env and restart.
```

Message your bot once, copy that id into `.env`, restart, and it will then answer only
you.

## Using the bots

| You send | What happens |
|---|---|
| A typed question | → `POST /chat` → advisor reply |
| A photo of a bill/invoice/ledger | → `"📷 Got your photo, reading it now..."` → OCR → structured → advice |
| `/new` (or `new chat` on WhatsApp) | Clears history and starts a fresh session |
| `/start` (Telegram only) | Short greeting explaining what the bot does |

## The API

**`POST /chat`**

```bash
curl -s -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"demo:1","message":"I have 98,000 cash and 95,000 loans due. Should I spend 80,000 on ads?"}'
```

```json
{ "reply": "Decision: Spend ₹80,000 on ads\nStatus: ❌ Not Recommended\nWhy: ..." }
```

**`POST /photo`**

```bash
curl -s -X POST http://localhost:3000/photo \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"demo:1\",\"mimetype\":\"image/jpeg\",\"base64Data\":\"$(base64 -i receipt.jpg)\"}"
```

Both accept an optional `history` array. **The server's own history wins** — a client
cannot rewrite its past to change an answer. A client-supplied `history` is honoured
only when the server has none for that session, which is the one useful case: the
backend restarted but the bot still holds the thread.

## Session isolation

Every session id is namespaced `channel:userId` — `whatsapp:919926565563@c.us`,
`telegram:123456789`. History is only ever read or written under that exact key, and
there is no shared or global history list, so one owner's figures cannot appear in
another owner's reply even with both chatting at once.

`/new` **rotates** the id (appending a timestamp) as well as clearing the old history,
so the slate is clean even if the reset call fails.

## Notes and limits

- **Storage is in-memory.** History clears when the backend restarts — deliberate at
  this stage, to keep dependencies minimal. To persist, swap the `Map` in
  `sessionStore.js` for `node:sqlite` (built into Node 22+, no new dependency); the
  module's exported functions are the only surface that touches storage, so nothing
  else needs to change.
- **This backend is standalone** and has no database access. It reasons only over what
  the owner types or photographs, not over stored business records. The Python
  LangGraph agent in `agent_code/` is the DB-grounded path; wiring them together would
  mean pointing `aiService` at that service instead of OpenRouter.
- **whatsapp-web.js is unofficial.** It automates WhatsApp Web, which is not a
  supported integration path, and heavy automated use of a personal number carries a
  real ban risk. Fine for a demo; the official WhatsApp Cloud API is the route for
  production.
- **Temperature is 0** on every call, so the same question over the same numbers gives
  a stable answer rather than a different figure each try.
- **Gemini model ids retire.** `gemini-2.0-flash` was already dead when this was built
  (the API returns a 404 naming its replacement). `GEMINI_MODEL` exists so you can
  swap it without touching code. To see what your key can currently use:
  ```bash
  curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" \
    | python3 -c "import sys,json;[print(m['name']) for m in json.load(sys.stdin)['models']]"
  ```

## Verified on 2026-08-22

Tested against live OpenRouter and Gemini APIs:

| Check | Result |
|---|---|
| `/health` | Both keys detected, model reported |
| `/chat` decision template | Correct `❌ Not Recommended`, and it **showed the arithmetic** (`98,000 − 95,000 = 3,000`) |
| Hallucination refusal | Asked to project revenue growth with no data, replied "I don't have enough information to answer this correctly" and listed what it needed — no invented percentage |
| Multi-turn memory | Recalled `₹98,000` from an earlier turn in the same session |
| Session isolation | A different `sessionId` asking the same question saw **nothing** from the first session |
| `/new` reset | History cleared; the figure was gone afterwards |
| `/photo` full pipeline | Read a **handwritten** 13-row ledger with every figure correct (9 sales = ₹15,975.50, 4 expenses = ₹5,970.50, net ₹10,005.00) |
| Photo honesty | Stated the total was **its own addition, not printed on the document**, and flagged that the ledger shows no currency symbol rather than assuming ₹ |
| Telegram bot | Starts, connects, enters discovery mode and logs chat ids |
| WhatsApp bot | Chromium launches, QR prints and is scannable |

Not tested end-to-end: a real WhatsApp message round-trip (needs the bot phone to scan
the QR) and a real Telegram message round-trip (needs a chat id in
`TELEGRAM_ALLOWED_CHAT_IDS`). Both transports were verified up to that handshake.
