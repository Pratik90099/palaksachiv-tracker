# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Get complete code (frontend + backend)

This repository already contains both layers:

- **Frontend app**: `src/` (React + Vite TypeScript web UI)
- **Backend/database layer**: `supabase/` (SQL migrations + edge functions)
- **Portable full database schema**: `docs/db/full_schema.sql`

To copy or archive the complete project locally:

```sh
# clone full repo
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# optional: create a zip with both frontend + backend code
zip -r palaksachiv-tracker-full.zip src supabase docs/db/full_schema.sql package.json README.md
```

If you only need backend assets for deployment/migrations, use `supabase/` + `docs/db/full_schema.sql`.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---


## Switching AI from Lovable to Gemini/ChatGPT

If you want to remove Lovable AI gateway usage and keep AI features on Gemini or OpenAI, follow **`docs/ai-provider-migration.md`**.

## Moving to an External PostgreSQL Database

Need a step-by-step runbook? See **`docs/external-database-guide.md`**.

This project ships with a portable, consolidated schema at
**`docs/db/full_schema.sql`** that replays the entire database structure
(tables, RLS policies, helper functions, indexes) on any vanilla
PostgreSQL 14+ instance — RDS, Cloud SQL, Azure Database, or on-prem.

### 1. Replay the schema

```bash
psql "$EXTERNAL_DATABASE_URL" -f docs/db/full_schema.sql
```

The script uses only the `pgcrypto` extension. RLS policies follow the
"public read, authenticated write" pattern. If your auth provider uses
role names other than `anon` / `authenticated`, edit the `DO $$ … $$`
block at the bottom of the file.

### 2. Re-point environment variables

Update `.env` (or your hosting platform's secrets) with:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Your new Postgres REST gateway URL (PostgREST, Hasura, or a custom API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key for client reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by edge functions for elevated writes |
| `LOVABLE_API_KEY` | (Edge function) Required if you keep the AI Insights / document processing functions |
| `VITE_DEMO_MODE` | Set to `"false"` in production to disable demo role logins |

### 3. Re-create the `documents` storage bucket

The `process-document` edge function uploads PDFs/CSVs to a private
`documents` bucket. On your new host:

- **AWS S3** — create a private bucket, generate an access key pair, update the
  upload helper to use `@aws-sdk/client-s3`.
- **MinIO / self-hosted** — same approach as S3 with a custom endpoint.
- **Azure Blob** — use `@azure/storage-blob` with a SAS token.

Update the storage call sites in `supabase/functions/process-document/index.ts`.

### 4. Port the four edge functions

| Function | Runtime | Action |
|---|---|---|
| `authenticate-cso` | Deno | Stateless email/password check — port to Node/Workers if needed |
| `process-document` | Deno | Re-point storage SDK |
| `generate-insights` | Deno | Re-point AI gateway URL |
| `parichay-callback` | Deno | Add real OAuth handshake when production credentials arrive |

### 5. e-Parichay SSO swap-point

When the government issues OAuth client credentials, only one file changes:
`supabase/functions/parichay-callback/index.ts`. The rest of the auth
pipeline (officer directory, `external_identities` mapping, `loginWithParichay`
adapter) is already wired and waiting.

CS Office can pre-map every officer's Parichay UID via **User Management →
Add / Edit Officer → Parichay UID** today, so the moment SSO is enabled
those officers will auto-login on their first visit.
