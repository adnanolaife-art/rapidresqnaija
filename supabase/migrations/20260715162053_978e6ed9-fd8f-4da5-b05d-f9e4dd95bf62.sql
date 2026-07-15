
create type public.app_role as enum ('citizen','responder_frsc','responder_police','responder_fire','responder_hospital','admin');
create type public.incident_type as enum ('medical','fire','police','traffic','other');
create type public.incident_status as enum ('pending','accepted','en_route','on_scene','resolved','cancelled');

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.tg_set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.get_my_roles()
returns setof public.app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

create policy "user_roles read own" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "user_roles admin manage" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _role public.app_role; _role_text text;
begin
  insert into public.profiles(id, full_name, phone, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', new.email)
  on conflict (id) do nothing;

  _role_text := coalesce(new.raw_user_meta_data->>'role', 'citizen');
  begin _role := _role_text::public.app_role;
  exception when others then _role := 'citizen'::public.app_role;
  end;
  if _role = 'admin' then _role := 'citizen'; end if;

  insert into public.user_roles(user_id, role) values (new.id, _role) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.responder_role_for_type(_t public.incident_type)
returns public.app_role language sql immutable as $$
  select case _t
    when 'medical' then 'responder_hospital'::public.app_role
    when 'fire' then 'responder_fire'::public.app_role
    when 'police' then 'responder_police'::public.app_role
    when 'traffic' then 'responder_frsc'::public.app_role
    else 'responder_police'::public.app_role
  end
$$;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references auth.users(id) on delete cascade,
  assignee_id uuid references auth.users(id),
  type public.incident_type not null,
  status public.incident_status not null default 'pending',
  description text,
  address text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.incidents to authenticated;
grant all on public.incidents to service_role;
alter table public.incidents enable row level security;

create policy "incidents citizen reads own" on public.incidents for select to authenticated using (citizen_id = auth.uid());
create policy "incidents responder reads matching" on public.incidents for select to authenticated using (public.has_role(auth.uid(), public.responder_role_for_type(type)));
create policy "incidents admin reads all" on public.incidents for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "incidents citizen creates own" on public.incidents for insert to authenticated with check (citizen_id = auth.uid());
create policy "incidents citizen updates own" on public.incidents for update to authenticated using (citizen_id = auth.uid()) with check (citizen_id = auth.uid());
create policy "incidents responder updates matching" on public.incidents for update to authenticated using (public.has_role(auth.uid(), public.responder_role_for_type(type))) with check (public.has_role(auth.uid(), public.responder_role_for_type(type)));
create policy "incidents admin updates all" on public.incidents for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "incidents owner deletes own" on public.incidents for delete to authenticated using (citizen_id = auth.uid());

create index incidents_status_created_idx on public.incidents (status, created_at desc);
create index incidents_type_idx on public.incidents (type);
create index incidents_citizen_idx on public.incidents (citizen_id);
create trigger incidents_updated_at before update on public.incidents for each row execute function public.tg_set_updated_at();

create table public.incident_media (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.incident_media to authenticated;
grant all on public.incident_media to service_role;
alter table public.incident_media enable row level security;

create policy "media read via incident" on public.incident_media for select to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_id and (
    i.citizen_id = auth.uid()
    or public.has_role(auth.uid(), public.responder_role_for_type(i.type))
    or public.has_role(auth.uid(),'admin')
  )));
create policy "media owner insert" on public.incident_media for insert to authenticated
  with check (exists (select 1 from public.incidents i where i.id = incident_id and i.citizen_id = auth.uid()));
create policy "media owner delete" on public.incident_media for delete to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_id and i.citizen_id = auth.uid()));

create index incident_media_incident_idx on public.incident_media (incident_id);

-- storage.objects policies (bucket already created)
create policy "incident-media owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'incident-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "incident-media read authorized" on storage.objects for select to authenticated
  using (bucket_id = 'incident-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_role(auth.uid(),'admin')
    or exists (
      select 1 from public.incident_media m
      join public.incidents i on i.id = m.incident_id
      where m.storage_path = name
        and public.has_role(auth.uid(), public.responder_role_for_type(i.type))
    )
  ));
create policy "incident-media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'incident-media' and (storage.foldername(name))[1] = auth.uid()::text);
