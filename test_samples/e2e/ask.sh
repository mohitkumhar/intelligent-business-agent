#!/usr/bin/env bash
# Send one chat query to the agent and print the intent + final answer text.
# Usage: ./ask.sh "your question"
Q="$1"
TIMEOUT="${2:-240}"
BODY=$(python3 -c 'import json,sys; print(json.dumps({"message": sys.argv[1]}))' "$Q")

curl -s -N -m "$TIMEOUT" -X POST http://localhost:5055/api/chat/send \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer demo' \
  -d "$BODY" 2>/dev/null | python3 -c '
import sys, json
intents=set(); tokens=[]; clar=None; err=None
for line in sys.stdin:
    line=line.strip()
    if not line.startswith("data: "): continue
    try: ev=json.loads(line[6:])
    except Exception: continue
    t=ev.get("type")
    if ev.get("intent_str"): intents.add(ev["intent_str"])
    if t=="token": tokens.append(ev.get("content",""))
    elif t=="clarification": clar=ev.get("clarification")
    elif t=="error": err=ev.get("error")
print("INTENT:", ",".join(sorted(intents)) or "?")
if err: print("ERROR:", err)
if clar: print("CLARIFICATION:", clar)
print("-"*70)
print("".join(tokens).strip() or "(no answer text)")
'
