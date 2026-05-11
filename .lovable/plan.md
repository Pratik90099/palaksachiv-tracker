## Goal

Make "Task Management" clearly visible to every officer role.

## Findings

- The tasks page lives at `/actionables` and is already routed for every authenticated role.
- The sidebar entry `Actionables` is registered for all 7 roles (`guardian_secretary`, `department_secretary`, `district_collector`, `divisional_commissioner`, `chief_secretary`, `cmo`, `system_admin`), so the link does render for the CSO/system_admin and Chief Secretary today.
- Tasks RLS allows public read; admins/officers can write. No backend gap.
- The likely cause of "not visible" is **terminology**: the menu reads "Actionables" instead of "Task Management", so admins looking for a "Tasks" entry don't recognise it.

## Plan

1. **Rename the navigation entry** in `src/components/AppSidebar.tsx` from `Actionables` → `Task Management` (icon stays `ClipboardList`). Keep the URL `/actionables` so deep-links and audit logs continue to work.
2. **Update page heading** in `src/pages/ActionablesPage.tsx`: title `Actionables` → `Task Management`, subtitle tweaked to "Track and manage all tasks across districts and departments". Primary button label stays "New Task".
3. **Confirm role coverage** — keep all 7 roles in the sidebar `roles` array (no change needed, just reverified):
  guardian_secretary, department_secretary, district_collector, divisional_commissioner, chief_secretary, cmo, system_admin.
4. **No route change, no RLS change, no data migration** — purely a labelling and visibility verification fix.
5. **Verify** by switching into each role via the login dropdown / impersonation and confirming the "Task Management" item appears in the sidebar and the page loads

## Out of scope

- Renaming the route path `/actionables`.
- Splitting Tasks into a separate page from Actionables.
- Changing audit-trail entity name (`tasks`).