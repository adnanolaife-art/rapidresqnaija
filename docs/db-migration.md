# DB Migration Guide

Every schema change is a migration in Lovable Cloud (Postgres). Order and structure are non-negotiable.

## Canonical migration order
For each new `public` table:
1. `CREATE TABLE`
2. `GRANT` to roles
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY` (deny-by-default; add explicit allow rules)
5. Indexes
6. Triggers (e.g. `updated_at`)

## Template
```sql
-- 1. Table
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references auth.users(id) on delete cascade,
  assignee_id uuid references auth.users(id),
  agency_id uuid references public.agencies(id),
  type text not null check (type in ('medical','fire','police','traffic','other')),
  status text not null default 'pending'
    check (status in ('pending','accepted','en_route','on_scene','resolved','cancelled','escalated')),
  lat double precision not null,
  lng double precision not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Grants (REQUIRED)
grant select, insert, update, delete on public.incidents to authenticated;
grant all on public.incidents to service_role;

-- 3. RLS
alter table public.incidents enable row level security;

-- 4. Policies
create policy "citizen reads own incidents"
  on public.incidents for select to authenticated
  using (citizen_id = auth.uid());

create policy "citizen creates own incidents"
  on public.incidents for insert to authenticated
  with check (citizen_id = auth.uid());

create policy "responder reads assigned or agency broadcast"
  on public.incidents for select to authenticated
  using (
    assignee_id = auth.uid()
    or (status = 'pending' and public.has_role(auth.uid(), 'responder'))
  );

create policy "admin reads agency scope"
  on public.incidents for select to authenticated
  using (public.has_role(auth.uid(), 'agency_admin')
         or public.has_role(auth.uid(), 'super_admin'));

-- 5. Indexes
create index incidents_status_created_idx on public.incidents (status, created_at desc);
create index incidents_assignee_idx on public.incidents (assignee_id);
create index incidents_geo_idx on public.incidents using gist (
  ll_to_earth(lat, lng)
);

-- 6. Trigger
create trigger set_updated_at
  before update on public.incidents
  for each row execute function public.tg_set_updated_at();
```

## Roles table (once per project)
Follow the `user_roles` + `has_role()` SECURITY DEFINER pattern. Never store roles on `profiles`.

## Rules
- **Never** ship a table without grants + RLS in the same migration.
- Every user-linked table has `on delete cascade` or explicit retention rule.
- Timestamps: `created_at`, `updated_at` on every table.
- Enums: prefer `text + check` for flexibility, or `create type` if truly stable.
- Foreign keys explicit; no orphan columns.
- Migrations are append-only in production — never edit a past migration; add a new one.

## Realtime
- Enable replication on tables consumed by realtime (`incidents`, `responder_locations`, `messages`).
- Broadcast minimal payloads; clients fetch details via server fn.

## Audit trigger example
```sql
create or replace function public.tg_audit_incident()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor_id, entity, entity_id, action, before, after)
  values (auth.uid(), 'incident', new.id, tg_op, to_jsonb(old), to_jsonb(new));
  return new;
end$$;
```
