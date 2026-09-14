# Combo Milan — PRD

## Original problem statement
Mobile-first app for phone-repair technicians in India to check spare-parts
compatibility. Universal search, category-first browse (9 part-type categories
with a nested Curve Glass sub-section under Tempered Glass), brand groups,
compatibility groups ("Model A = Model B = Model C") with source + verified
status + a shared confirm count, Hindi/English toggle, passcode-gated admin
add-data screen, suggest-a-correction (pending review), Voltage Divider
Calculator, Export to Excel. Dark workshop/utility aesthetic (graphite #14171c,
amber #f5a623, teal verified stamp #2bd9ae). Data starts empty.

## Architecture
- Backend: FastAPI + MongoDB, all routes under `/api`. Collections:
  `compat_groups`, `models`, `pending_submissions` (uuid ids, soft-delete field
  `deleted_at`, `_id` excluded). Categories & brand groups are static (served by
  `/api/meta`). Admin passcode in `backend/.env` (`ADMIN_PASSCODE=4321`).
- Frontend: Expo Router (stack). Dark-only theme in `src/theme.ts`. Fonts:
  Oswald (display) + Noto Sans Devanagari (body, Latin+Devanagari) via
  `expo-font`. Data via `@tanstack/react-query` (`src/api.ts`). i18n context in
  `src/i18n.tsx`. Bottom sheet via `@gorhom/bottom-sheet`. Icons: phosphor.

## User persona
Repair technician / shop owner who needs to quickly find which phone models
share the same spare part, and confirm/flag community data.

## Core requirements (static)
- Universal search across brand/model/part/category/source with live panel +
  auto-open + scroll-to-entry.
- 9 categories; Curve Glass nested under Tempered Glass; brand groups with counts.
- Compatibility groups: models, source, verified/unconfirmed, shared confirmCount.
- Hindi/English toggle. Passcode admin add-data. Suggest correction (pending).
- Voltage Divider Calculator, Export to Excel. Mobile-first layout rules.

## Implemented (2026-06)
- Full backend endpoints: `/api/meta`, `/api/groups` (list/create/confirm),
  `/api/models`, `/api/submissions`, `/api/admin/verify`.
- Home: header + language toggle, full-width action row, sticky search with live
  results panel + scroll-to/highlight, category accordion, nested Curve Glass,
  brand groups with counts, compatibility cards (stat pills, verified stamp,
  wrapped model line, source, Confirm w/ count, Suggest correction).
- Admin unlock keypad (passcode 4321) → Add Data form (group + model).
- Suggest-correction bottom sheet → pending submissions.
- Voltage Divider Calculator. Export to Excel (CSV share on native / download web).
- EN/HI localization for all UI labels; phone model names stay English.
- Verified via testing agent: 11/11 backend, all frontend flows passed.

## Backlog (prioritized)
- P1: Admin review screen to approve/reject pending submissions into live data.
- P1: Delete/edit compatibility groups from admin.
- P2: Real brand logos (currently initial-avatars).
- P2: Import from Excel/CSV (bulk data entry).
- P2: Offline cache of catalog for workshop use with poor signal.

## Next tasks
- Build admin pending-review approval flow.
- Add edit/delete for existing compatibility groups.
