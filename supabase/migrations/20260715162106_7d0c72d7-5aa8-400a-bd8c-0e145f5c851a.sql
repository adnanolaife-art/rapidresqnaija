
alter function public.tg_set_updated_at() set search_path = public;
alter function public.responder_role_for_type(public.incident_type) set search_path = public;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.get_my_roles() from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.get_my_roles() to authenticated;
