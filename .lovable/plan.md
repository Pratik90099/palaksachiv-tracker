

# Plan: Upgrade AI Layer to Latest Gemini Model

The portal already calls Google Gemini through the Lovable AI Gateway (no separate Gemini API key needed). Currently both AI edge functions hard-code `google/gemini-2.5-flash`. This plan upgrades the model to the latest **`google/gemini-3-flash-preview`** for better reasoning quality on insights and document extraction, with no code-architecture or cost-tier change.

## Changes

### 1. `supabase/functions/generate-insights/index.ts`
- Replace `model: "google/gemini-2.5-flash"` with `model: "google/gemini-3-flash-preview"` in the AI gateway call.
- Tool-calling structured output (headline / key_insights / risks / recommendations) stays unchanged.

### 2. `supabase/functions/process-document/index.ts`
- Replace `model: "google/gemini-2.5-flash"` with `model: "google/gemini-3-flash-preview"` for document summarization, project extraction, task extraction, and action-item extraction.
- All four `SYSTEM_PROMPTS` modes remain the same.

### 3. `src/pages/InsightsPage.tsx`
- Update the small footer label from `"Powered by Lovable AI · gemini-2.5-flash"` to `"Powered by Lovable AI · Gemini 3 Flash"` so the UI reflects the live model.

### 4. Verification
- After deploy, test "Generate Insights" once (CS Office) and one document upload to confirm both edge functions return successfully on the new model.
- No DB schema, no new secrets, no new connectors.

## Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-insights/index.ts` | Model → `google/gemini-3-flash-preview` |
| `supabase/functions/process-document/index.ts` | Model → `google/gemini-3-flash-preview` |
| `src/pages/InsightsPage.tsx` | Footer label updated |

## What this delivers

- AI Insights and Document AI now run on the latest Gemini Flash generation — sharper summaries and extraction with similar latency/cost to the existing flash tier.
- No new infrastructure, no GCP project, no Parichay/auth changes.
- LOVABLE_API_KEY (already configured) continues to authenticate every call; rate-limit and credits-exhausted handling already in place stays intact.

