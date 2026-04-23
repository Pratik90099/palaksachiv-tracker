

# Plan: Final Mock-Data Cleanup + Working Alert Acknowledge

Most of the originally-listed items are already shipped (auth-adapter, Parichay button wired, officer directory with `parichay_uid` / `is_cso_admin` / "Login As", README external-DB guide, `docs/db/full_schema.sql`). The only outstanding work is the four cleanup items.

---

## 1. GOI Pending — remove fake mock numbers

In `src/pages/GOIPendingPage.tsx`:

- Delete the hard-coded `MINISTRY_DATA` array.
- Replace the hard-coded `₹1,670 Cr` "Amount Blocked" stat with the live count of GOI items with no monetary figure (or hide the card until a real `amount` field exists).
- Replace the hard-coded `8` "Ministries Involved" stat with a derived count from `goiItems` (using their `agency` field) — shows `0` on an empty DB.
- Replace the Ministry-wise Distribution pie with either:
  - a live aggregation grouped by `task.agency` (preferred), or
  - an empty-state card "No GOI items recorded yet" when `goiItems.length === 0`.

Result: empty DB → all zeros and an empty-state, not fake numbers.

## 2. Alerts page — wire to real notifications + working acknowledge

Rewrite `src/pages/AlertsPage.tsx` to:

- Delete the entire `MOCK_ALERTS` array.
- Read live data from `useNotifications()` (already exists, already realtime-subscribed).
- Map `notification.type` → severity level (`error` → `critical`, `warning` → `warning`, `info` → `info`, etc.), with sensible defaults.
- Treat `is_read === false` as "unacknowledged".
- Wire the **Acknowledge** button to call `markAsRead(notification.id)` (already exposed by the hook).
- Wire the **Mark All Read** button to call `markAllAsRead()`.
- Show empty-state "No alerts at this time" when the list is empty.

Result: alerts now reflect real notifications, the Acknowledge button works, and the unread badge in the header (which already uses `useNotifications`) stays in sync.

## 3. State Governance Scorecard — no more fake fallback scores

In `src/pages/GovernanceScorecardPage.tsx`, the live aggregation is already in place, but each metric falls back to `50`/`70` when there's no data — which renders as fake-looking scores on an empty DB. Fix:

- When a district has zero projects/tasks/visits, return `null` for that sub-score (not `50`/`70`).
- Compute the composite only over non-null sub-scores; if **all** sub-scores are null, mark the district as "No data" and skip ranking.
- Render `—` for null sub-scores in the table and show a "No data — awaiting first project / visit / actionable" badge for those districts.
- Empty-state message above the table when **every** district is "No data": "Scorecard activates once tasks and visits are recorded."
- Top 15 chart only renders districts with a real composite score.

Result: scorecard honestly shows "no data" on a fresh deployment instead of a sea of 50/70 placeholder scores.

## 4. Confirm no other transactional mocks remain

Spot-check after edits: search `src/pages` for any remaining hard-coded arrays (e.g., `MINISTRY_DATA`, `MOCK_*`, hard-coded "Cr" amounts). Remove anything that doesn't trace back to a database query or an enum/config in `src/lib/mock-data.ts`.

---

## Files changed

| File | Change |
|---|---|
| `src/pages/GOIPendingPage.tsx` | Remove `MINISTRY_DATA`, hard-coded ₹/ministries; live aggregation + empty state |
| `src/pages/AlertsPage.tsx` | Replace `MOCK_ALERTS` with `useNotifications`; wire Acknowledge / Mark All Read |
| `src/pages/GovernanceScorecardPage.tsx` | Drop `50`/`70` fallbacks; render "No data" when district has no records |

---

## What this delivers

- Empty database → empty-state UI everywhere; no remaining "demo" numbers.
- The Acknowledge button on alerts actually marks notifications read (and the header bell badge updates in real time).
- Governance Scorecard honestly reflects real activity instead of inventing a baseline.
- Combined with the already-shipped auth-adapter, Parichay-wired login, officer directory with `parichay_uid` + "Login As", and the `docs/db/full_schema.sql` migration script, the portal is now ready for the external-Postgres cutover and the e-Parichay rollout.

