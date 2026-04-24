

# Plan: Decouple AI Layer from Lovable API Gateway — Direct Gemini Only

Currently both AI edge functions call `https://ai.gateway.lovable.dev/v1/chat/completions` using `LOVABLE_API_KEY`. This plan replaces that with **direct calls to the Google Gemini API** using a user-supplied `GEMINI_API_KEY`. No Lovable AI Gateway calls remain anywhere in the codebase.

## 1. New secret required

Add a new edge-function secret:
- **`GEMINI_API_KEY`** — obtained from Google AI Studio (https://aistudio.google.com/apikey).

The implementation will request this via the secrets tool before deploying. `LOVABLE_API_KEY` is no longer read by either function (the platform may still keep it set, but our code will not reference it).

## 2. `supabase/functions/generate-insights/index.ts`

Replace the OpenAI-style chat-completions call with a direct Gemini `generateContent` call.

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
- **Request body:** Gemini-native shape using `contents` + `systemInstruction` + `tools[].functionDeclarations` for structured output (the existing `submit_insights` schema maps directly to a Gemini function declaration).
- **Tool-forced output:** set `toolConfig.functionCallingConfig.mode = "ANY"` with `allowedFunctionNames: ["submit_insights"]` so Gemini must call the function — preserves today's structured `{ headline, key_insights, risks, recommendations }` contract.
- **Response parsing:** read the function call from `candidates[0].content.parts[].functionCall.args` instead of `choices[0].message.tool_calls[0].function.arguments`.
- **Error handling:** map Gemini's 429 → "Rate limit exceeded" and 403/401 → "AI key invalid"; remove the Lovable-specific 402 "credits exhausted" branch (Gemini billing is handled in Google Cloud).
- All existing auth/role checks (JWT, `x-cso-email`, `is_cso_admin` gate, rate limit) stay exactly as they are.

## 3. `supabase/functions/process-document/index.ts`

Same swap, simpler shape (no tool calling — JSON-mode output).

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
- **Request body:** `contents: [{ role: "user", parts: [{ text: userPrompt }] }]`, `systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[mode] }] }`, and `generationConfig: { responseMimeType: "application/json" }` so Gemini returns valid JSON directly (eliminates the markdown-fence stripping hack, though we'll keep the fallback parser as a safety net).
- **Response parsing:** read text from `candidates[0].content.parts[0].text`, then `JSON.parse`.
- All input validation (`MAX_CONTENT_LENGTH`, mode whitelist, filename trimming), the `validateAiResult` shape checker, and CORS headers stay unchanged.

## 4. UI label

`src/pages/InsightsPage.tsx` footer already reads "Powered by Gemini 3 Flash". Update to **"Powered by Google Gemini"** so it accurately reflects "direct Gemini, not via Lovable AI" — and avoids tying the label to a specific model version we may swap.

## 5. Documentation / memory

Update `mem://features/ai-document-processing` (and add a new `mem://architecture/ai-provider` note) to record: AI calls go **directly to Google Gemini API**; `GEMINI_API_KEY` is the only credential; no Lovable AI Gateway dependency.

## 6. Verification after deploy

- Call **Generate Insights** once as a CSO admin → confirm structured payload appears and is persisted to `ai_insights`.
- Upload one document via Document AI in `summarize` mode → confirm summary returns.
- Check edge function logs to confirm outbound requests now hit `generativelanguage.googleapis.com` (not `ai.gateway.lovable.dev`).

## Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-insights/index.ts` | Replace Lovable Gateway call with direct Gemini `generateContent` + function-calling for structured insights |
| `supabase/functions/process-document/index.ts` | Replace Lovable Gateway call with direct Gemini `generateContent` + JSON response mime type |
| `src/pages/InsightsPage.tsx` | Footer label → "Powered by Google Gemini" |
| `mem://architecture/ai-provider` (new) | Record direct-Gemini decision and key |
| `mem://features/ai-document-processing` | Note provider switch |

## What this delivers

- Zero references to `LOVABLE_API_KEY` or `ai.gateway.lovable.dev` in the AI code paths.
- All AI traffic flows **directly from the edge function to Google's Gemini API** using your own `GEMINI_API_KEY`.
- Structured insights and document extraction continue to work with the same response contracts the UI already consumes — no frontend logic changes beyond the footer label.
- Rate-limit / quota / billing now governed entirely by your Google AI account, not by Lovable credits.

## Operator follow-up (after approval, before deploy)

1. Generate a Gemini API key at https://aistudio.google.com/apikey.
2. When prompted, paste it as the `GEMINI_API_KEY` secret.
3. (Optional) Once verified, the `LOVABLE_API_KEY` secret can be deleted from project settings — no code reads it anymore.

