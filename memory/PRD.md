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
- (2026-06) Category list expanded to 15: added Main Flex/Charging Flex,
  Speaker/Ringer, Camera Glass, Back Panel, Panel Button, SIM Tray.
- (2026-06) Search results highlight matched text in amber (Fast Smart Search).
- (2026-06) Voltage Divider Calculator now has Basic + Advanced modes; Advanced
  supports 2-6 series resistors with per-resistor voltage drops, total
  resistance and circuit current.
- (2026-06) Bulk data import round 1: 227 Touch/OCA Glass compatibility groups
  seeded from user's universal lists (60 verified, with shop sources like
  Krishna Mobile Mankapur, Patel Telecom Sanchore, Suresh Communication Delhi,
  Radhe Mobile Manasa, Balaji Mobile Kalapipal, Rajaram Telecom Raipur).
  Brand split: Itel/Tecno/Infinix 47, Redmi/Poco 42, Vivo/iQoo 39,
  Realme/Oppo/OnePlus 38, Samsung 36, Lava/Micromax/Moto 25.
  Seed script: /tmp/seed_oca.py (re-runnable reference).
  More categories' data expected from user next.
- (2026-06) Bulk data import round 2: 257 Folder/Display/Combo (Universal
  Combo List) groups seeded. Brand split: Itel/Tecno/Infinix 56,
  Realme/Oppo/OnePlus 48, Vivo/iQoo 46, Redmi/Poco 44, Samsung 37,
  Lava/Micromax/Moto 26. 43 verified. New sources: Muskan Mobile Firozabad,
  Gulab Telecom Punjab, Mummy Daddy Agency Thirukovilur, Suman Unique Center,
  Badal Mobile Daringbadi, Hitesh Mobile Gandamer Chowk, MS Mobile Service
  Point, MK Mobile Raiganj. Seed script: /tmp/seed_combo.py.
  Totals now: 484 groups, 103 verified.
- (2026-06) Bulk data import round 3: Tempered Glass. 41 normal-glass groups
  (Universal Tempered Glass List, cross-brand mixed groups grouped under first
  brand) + 28 UV-glass groups imported into the Curve Glass sub-category
  (13 verified). Added new brand groups: Apple (iPhone 13/13 Pro/14) and Others.
  Duplicate Lava/Moto combo section in the paste was skipped (already imported).
  Seed script: /tmp/seed_tempered.py. Totals now: 553 groups, 116 verified.
- (2026-06) Tempered Glass category now shows a "Normal Glass" sub-section
  (amber, default open) with brand groups inside, above the "Curve Glass"
  (teal) sub-section — per user request "pahele normal glass dikhna chahiye".
- (2026-06) Bulk data import round 4: Display Connector. 262 groups
  (Vivo/iQoo 46, Redmi/Poco 45, Realme/Oppo/OnePlus 51, Samsung 38,
  Itel/Tecno/Infinix 56, Lava/Micromax/Moto 26), 28 verified. New sources:
  Itworld Rayya, MS Mobile Service Point Pali Rajasthan.
  Seed script: /tmp/seed_connector.py.
- (2026-06) UI fix: brand group names no longer truncate ("Realme/Oppo/OnePlus"
  shows in full, wraps instead of ellipsis) — per user request.
  Totals now: 815 groups, 144 verified.

## Backlog (prioritized)
- P1: Admin review screen to approve/reject pending submissions into live data.
- P1: Delete/edit compatibility groups from admin.
- P2: Real brand logos (currently initial-avatars).
- P2: Import from Excel/CSV (bulk data entry).
- P2: Offline cache of catalog for workshop use with poor signal.

## Next tasks
- Build admin pending-review approval flow.
- Add edit/delete for existing compatibility groups.
