# Plan

## 1. Open Task Management & Meeting Minutes to all roles

**Sidebar (`src/components/AppSidebar.tsx`)** — extend `roles` arrays:
- **Actionables** (task management): add `system_admin` (already covers other officer roles).
- **Meeting Minutes** (`/meeting-minutes`): currently only `system_admin` + `chief_secretary`. Expand to all roles: `guardian_secretary`, `department_secretary`, `district_collector`, `divisional_commissioner`, `chief_secretary`, `cmo`, `system_admin`.

**Page-level access**
- `RecordMinutesPage.tsx` & `ActionablesPage.tsx`: verify there is no role-gate that blocks non-CS users. If a guard exists, relax it so all authenticated officer roles can view and create.
- Existing `useRoleFilter` will scope visible records to each role's district/department/division automatically — no changes needed there.

Note: this is UI/access only; RLS policies already allow writes by any officer with `current_officer_id() IS NOT NULL`, so backend stays as-is.

## 2. Help page cleanup (`src/pages/HelpPage.tsx`)

- **Remove** the "NIC Portal" entry (and the now-unused `ExternalLink` import).
- **Update Email Support**:
  - Title: `Email Support`
  - Primary: `cs@maharashtra.gov.in`
  - CC: `bavipratik@gmail.com`, `rishishirke65@gmail.com`
  - `mailto:` href: `mailto:cs@maharashtra.gov.in?cc=bavipratik@gmail.com,rishishirke65@gmail.com`
- **Update Helpdesk**:
  - Display: `022-2202-5042 (Mon–Sat, 10 AM – 6 PM)`
  - href: `tel:+912222025042`

## 3. Contact / Footer alignment

- `src/pages/static/ContactPage.tsx`: add the same email + helpdesk number under "Helpline" so the static GIGW contact page matches.
- `src/components/SiteFooter.tsx`: if it shows a support email/phone, update to the new values; otherwise leave as-is.

## Out of scope
- No DB/RLS changes.
- No new features; existing minutes/tasks UIs are reused.
