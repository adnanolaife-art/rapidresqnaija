# AGENT.md — RapidResQ Naija

Operating guide for any AI/human agent contributing code to RapidResQ Naija.

## Mission
Build a reliable, low-latency emergency response platform for Nigeria connecting citizens → responders (Police, Fire, Ambulance, FRSC, Hospitals) → government admins.

## Non-negotiables
1. **Life-safety first.** SOS path must never be blocked by non-critical failures (analytics, ads, non-essential API calls).
2. **Offline-tolerant.** Citizen SOS must queue and retry if network is degraded.
3. **Privacy by default.** Location + media only shared with the assigned responder and next-of-kin the user selected.
4. **Auditability.** Every incident state change is logged and immutable.
5. **Accessibility.** WCAG AA, large tap targets (≥56px for SOS), high-contrast, screen-reader labels in EN + pidgin-friendly copy.

## Three surfaces
- **Citizen app** — SOS trigger, live tracking, family alerts, incident history.
- **Responder dashboard** — queue, accept, navigate, resolve, chat with citizen.
- **Admin/Gov dashboard** — agency mgmt, analytics, audit logs, user roles.

## How agents work here
- Read `docs/architecture.md` before touching structure.
- Follow `docs/code-style.md` for every file.
- Use design tokens from `docs/design-system.md` — never hardcode colors.
- New tables: follow `docs/db-migration.md` (grants + RLS mandatory).
- New endpoints: follow `docs/api-router-scaffold.md`.
- New UI: follow `docs/component-builder.md`.
- Security review checklist: `docs/security.md`.

## Definition of Done
- Types pass, build passes, no console errors in preview.
- SOS-affecting changes tested end-to-end (trigger → responder receives).
- RLS policies present on any new `public.*` table.
- No secrets in code; use Lovable Cloud secrets.
- Copy reviewed for clarity under stress (short, imperative).
