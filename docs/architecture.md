# Architecture — RapidResQ Naija

## Stack
- **Frontend:** TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui.
- **Backend:** Lovable Cloud (Postgres + Auth + Storage + Edge functions under the hood).
- **Server logic:** TanStack `createServerFn` for app-internal RPC; `src/routes/api/public/*` for webhooks (SMS, payment, agency callbacks).
- **Realtime:** Supabase Realtime channels for incident state, responder location, chat.
- **AI:** Lovable AI Gateway for triage classification and voice-to-text on reports.

## High-level flow
```text
Citizen App ──SOS──▶ createServerFn(createIncident)
                         │
                         ├─▶ incidents (insert, status=pending)
                         ├─▶ notifications (family SMS via webhook)
                         └─▶ realtime: broadcast to nearest responders
                                         │
Responder Dashboard ◀── subscribe ───────┘
     │ accept → update incidents.status='accepted', assignee=me
     │ location pings → responder_locations
     │ resolve → status='resolved', close audit entry
Admin Dashboard ── read aggregates, audit_logs, agency mgmt
```

## Modules
| Module | Path | Purpose |
| --- | --- | --- |
| Routes | `src/routes/` | File-based routes. `_authenticated/` for gated. `api/public/` for webhooks. |
| Server fns | `src/lib/*.functions.ts` | Client-callable RPC. |
| Server helpers | `src/lib/*.server.ts` | Admin/service-role logic. Never imported from client code. |
| UI | `src/components/` | Presentational + composed shadcn components. |
| Hooks | `src/hooks/` | Data + realtime hooks. |
| Domain | `src/domain/` | Types + pure logic (incident state machine, geo utils). |

## Incident state machine
`pending → accepted → en_route → on_scene → resolved`
Terminal alt: `cancelled`, `escalated`. Transitions only through `updateIncidentStatus` server fn (guards + audit write).

## Data ownership
- **Citizen** owns their profile, incidents they created, next-of-kin list.
- **Responder** sees incidents assigned to their agency + accepted by them.
- **Admin** sees their agency scope; super-admin sees all.
Enforced via RLS + `has_role(user_id, role)`.

## Environments
- Preview: `project--<id>-dev.lovable.app`
- Prod: `project--<id>.lovable.app`
Cron/webhooks target the stable URL above under `/api/public/*`.
