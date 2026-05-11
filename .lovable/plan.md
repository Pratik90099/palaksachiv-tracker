## Goal
Replace the Lovable AI Gateway with direct calls to Google's Gemini API (using your own API key) in both AI-powered edge functions: `process-document` and `generate-insights`.

## Security first (do this before I implement)

You pasted the API key in chat, which means it should be considered leaked.

1. Go to https://aistudio.google.com/apikey
2. Delete the key starting with `AIzaSyDCbPgAym...`
3. Create a fresh key
4. When I start implementation, I'll prompt you with a secure form to paste the **new** key — it gets stored as a backend secret named `GEMINI_API_KEY`, never written to the codebase, never shipped to the browser.

Do not paste the new key in chat.

## What changes

### 1. New backend secret
- `GEMINI_API_KEY` — your Google AI Studio key, used only inside edge functions.

### 2. `supabase/functions/process-document/index.ts`
- Replace the `fetch("https://ai.gateway.lovable.dev/v1/chat/completions", ...)` block with a direct call to Google's Generative Language API:
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  - Convert the existing `messages: [{role:"system",...},{role:"user",...}]` payload into Gemini's native shape (`systemInstruction` + `contents`).
  - Parse `candidates[0].content.parts[0].text` instead of `choices[0].message.content`.
- Keep all surrounding logic untouched: auth check, input validation, mode routing, JSON shape validation, audit log, CORS, error handling.
- Map Google error codes to the same user-facing messages already used for 429 (rate limit) and 402-equivalent (quota exhausted → `RESOURCE_EXHAUSTED`).

### 3. `supabase/functions/generate-insights/index.ts`
- Same swap: direct Gemini call instead of gateway.
- Tool-calling shape changes: convert the OpenAI-style `tools` + `tool_choice` block into Gemini's `tools: [{functionDeclarations: [...]}]` + `toolConfig: {functionCallingConfig: {mode:"ANY", allowedFunctionNames:["submit_insights"]}}`.
- Read structured output from `candidates[0].content.parts[0].functionCall.args` instead of `tool_calls[0].function.arguments`.
- Keep CSO-admin authorization, stats aggregation, and `ai_insights` insert exactly as-is.

### 4. Model choice
- Use `gemini-2.5-flash` (fast, cheap, supports function calling, generally available — `gemini-3-flash-preview` is a Lovable-gateway alias not available on the public Google API).

## What stays the same
- All UI (Document AI page, Insights page).
- Auth, RLS, validation, audit logging.
- The `LOVABLE_API_KEY` secret stays (it's auto-managed and harmless to leave). After this change, no edge function reads it.
- Lovable AI Gateway is no longer used; billing for these features goes to your Google Cloud / AI Studio account directly.

## Out of scope
- Streaming responses (current functions are non-streaming; no UI change requested).
- Switching the OTP/email functions — they don't use AI.
- Any frontend changes.

## Verification after build
- Deploy both functions, then from the app:
  - Document AI page → upload a small text doc → confirm summary returns.
  - AI Insights page → "Generate Insights" → confirm the four-section card renders.
- Check edge function logs for either function if anything fails.