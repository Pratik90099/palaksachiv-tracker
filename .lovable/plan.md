

# Plan: AI Document Processing + Security Hardening

## What We're Building

A document upload and AI processing feature for CS Office users, plus critical security fixes to make the app deployment-ready.

---

## Step 1: Database Setup

**Migration: `document_uploads` table + `documents` storage bucket**

- Table `document_uploads`: id, file_name, file_type, file_size (int), storage_path, processing_mode (text), ai_result (jsonb), uploaded_by (text), created_at
- RLS: public access (matching current demo pattern)
- Storage bucket `documents` (public: false) with RLS for authenticated insert/select

---

## Step 2: Edge Function — `process-document`

Server-side function that receives document text content + processing mode, calls Lovable AI (google/gemini-3-flash-preview), returns structured results.

- **Modes**: `summarize`, `extract-projects`, `extract-tasks`, `extract-action-items`
- Input validation: max 500KB text content, required mode field
- CORS headers included
- Uses `LOVABLE_API_KEY` (already configured)
- Tailored system prompts per mode to return structured JSON
- Error handling for 429/402 rate limits surfaced to client

---

## Step 3: Edge Function — `authenticate-cso`

Moves CS Office credential validation server-side. Removes hardcoded passwords from client bundle.

- Accepts email + password, validates against stored credentials
- Returns success/failure (no real session token since auth is mock, but passwords are no longer in JS bundle)
- Credentials stored as constants in the edge function (server-side only)
- `LoginPage.tsx` updated to call this edge function instead of `loginWithEmail`
- `auth-context.tsx`: remove `CS_OFFICE_USERS` array and password data from client code

---

## Step 4: Frontend — Document AI Page (`/document-ai`)

New page accessible only to CS Office (system_admin) role:

- File upload area (drag-and-drop) accepting PDF, DOCX, CSV, TXT (max 5MB)
- Mode selector: Summarize | Extract Projects | Extract Tasks | Extract Action Items
- Client reads file as text, sends to `process-document` edge function
- Results panel with formatted AI output
- "Import to Database" buttons for extracted projects/tasks (calls existing `useCreateProject`/`useCreateTask` hooks)
- Upload history list from `document_uploads` table

---

## Step 5: Security Hardening

1. **Remove client-side passwords** — handled by Step 3
2. **Input validation on all forms**:
   - Meeting minutes: title max 255, minutes_text max 10000, attendee names max 100 each
   - Project/Task forms: title max 255, description max 5000
   - Add validation in `RecordMinutesPage.tsx`, `ProjectFormDialog.tsx`, `TaskFormDialog.tsx`
3. **XSS in PDF export** — sanitize user content in `generateMinutesPDF()` by escaping HTML entities before inserting into template
4. **Remove credential hints** — remove the "Default password: cso@2026" text from LoginPage after server-side auth is working

---

## Step 6: Routing & Navigation

- Add `/document-ai` route in `App.tsx` (protected)
- Add "Document AI" entry in `AppSidebar.tsx` with `FileUp` icon, restricted to `system_admin` role
- Place it near Meeting Minutes in the nav order

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/...` | New table + storage bucket |
| `supabase/functions/process-document/index.ts` | New edge function |
| `supabase/functions/authenticate-cso/index.ts` | New edge function |
| `src/pages/DocumentAIPage.tsx` | New page |
| `src/pages/LoginPage.tsx` | Call edge function for CSO login, remove password hints |
| `src/lib/auth-context.tsx` | Remove `CS_OFFICE_USERS` passwords from client |
| `src/pages/RecordMinutesPage.tsx` | Input validation + XSS fix in PDF |
| `src/components/ProjectFormDialog.tsx` | Input length validation |
| `src/components/TaskFormDialog.tsx` | Input length validation |
| `src/components/AppSidebar.tsx` | Add Document AI nav item |
| `src/App.tsx` | Add /document-ai route |

## Technical Notes

- **AI Model**: google/gemini-3-flash-preview via Lovable AI gateway — no API key needed from user
- **Data privacy**: Document content flows client → edge function → Lovable AI gateway. No third-party storage.
- **File size limit**: 5MB enforced client-side before upload
- **LOVABLE_API_KEY**: Already configured and available

