# Migrating AI Functions off Lovable (to Gemini or ChatGPT/OpenAI)

This project currently calls Lovable's AI gateway in two edge functions:

- `supabase/functions/process-document/index.ts`
- `supabase/functions/generate-insights/index.ts`

You can keep these edge functions and swap only the AI provider call.

---

## 1) Identify current Lovable-specific call sites

Both functions currently call:

- URL: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Header key from env: `LOVABLE_API_KEY`

Search quickly:

```bash
rg -n "ai.gateway.lovable.dev|LOVABLE_API_KEY" supabase/functions
```

---

## 2) Add provider-agnostic env variables

Set these secrets for edge functions:

- `AI_API_BASE_URL`
  - OpenAI: `https://api.openai.com/v1`
  - Gemini (OpenAI-compatible): `https://generativelanguage.googleapis.com/v1beta/openai`
- `AI_API_KEY` (provider key)
- `AI_MODEL`
  - OpenAI examples: `gpt-4.1-mini`, `gpt-4o-mini`
  - Gemini examples: `gemini-2.5-flash`, `gemini-2.5-pro`

Keep `LOVABLE_API_KEY` only as fallback during transition, then remove it.

---

## 3) Replace request URL + auth header in both functions

In each function, replace provider-specific lines with:

```ts
const AI_API_BASE_URL = Deno.env.get("AI_API_BASE_URL") || "https://api.openai.com/v1";
const AI_API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4.1-mini";

if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${AI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: AI_MODEL,
    messages,
  }),
});
```

> `generate-insights` currently uses `tools` + `tool_choice`; these are supported by OpenAI-compatible chat APIs. Keep the same JSON shape.

---

## 4) Provider-specific notes

### OpenAI (ChatGPT API)

- Base URL: `https://api.openai.com/v1`
- Model: set via `AI_MODEL`
- API key: `AI_API_KEY` (starts with `sk-...`)

### Gemini (via OpenAI-compatible endpoint)

- Base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
- Use a Gemini model in `AI_MODEL`.
- Keep payload in OpenAI chat-completions format for easiest migration.

---

## 5) Validation checklist

1. Deploy edge functions with new secrets.
2. Call `process-document` with sample text and verify JSON response.
3. Call `generate-insights` and verify structured tool payload persists to `ai_insights`.
4. Remove `LOVABLE_API_KEY` secret after successful cutover.

---

## 6) Optional: fully decouple from edge functions

If you want zero Lovable/Supabase function dependency:

- Move AI orchestration to your own backend (Node/FastAPI/etc.).
- Keep response contracts identical to current frontend expectations.
- Point frontend API calls to your backend endpoints.

