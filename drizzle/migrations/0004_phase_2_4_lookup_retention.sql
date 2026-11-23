create or replace function public.public_request_status(_slug text, _code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object('kind','housing','status',d.status,'created_at',d.created_at) from public.diversion_requests d join public.cities c on c.id = d.city_id where c.slug = _slug and upper(d.tracking_code) = upper(trim(_code)) limit 1),
    (select jsonb_build_object('kind','wellness','status',w.status,'created_at',w.created_at) from public.wellness_checks w join public.cities c on c.id = w.city_id where c.slug = _slug and upper(w.tracking_code) = upper(trim(_code)) limit 1))
$$;
grant execute on function public.public_request_status(text, text) to anon, authenticated;

create or replace function public.purge_city_records(_city uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare days int; cutoff timestamptz; n_d int; n_w int; n_e int; n_r int;
begin
  select coalesce(nullif(settings->'privacy'->>'retentionDays','')::int, 1095) into days from public.city_settings where city_id = _city;
  if days is null or days < 30 then days := 1095; end if;
  cutoff := now() - make_interval(days => days);
  delete from public.ride_dispatches where city_id = _city and created_at < cutoff; get diagnostics n_r = row_count;
  delete from public.field_encounters where city_id = _city and created_at < cutoff; get diagnostics n_e = row_count;
  delete from public.wellness_checks where city_id = _city and status = 'resolved' and created_at < cutoff; get diagnostics n_w = row_count;
  delete from public.diversion_requests d where d.city_id = _city and d.status in ('closed','paid') and d.created_at < cutoff
    and not exists (select 1 from public.micro_grants g where g.request_id = d.id); get diagnostics n_d = row_count;
  insert into public.audit_log(city_id, actor_id, action, details) values (_city, auth.uid(), 'retention.purged',
    jsonb_build_object('retention_days', days, 'housing', n_d, 'wellness', n_w, 'encounters', n_e, 'rides', n_r));
  return jsonb_build_object('retention_days', days, 'housing', n_d, 'wellness', n_w, 'encounters', n_e, 'rides', n_r);
end $$;
revoke all on function public.purge_city_records(uuid) from public, anon, authenticated;

create or replace function public.purge_my_city_records() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if public.current_city_id() is null or public.staff_role(auth.uid()) <> 'supervisor' then raise exception 'Only supervisors can run retention cleanup'; end if;
  return public.purge_city_records(public.current_city_id());
end $$;
revoke all on function public.purge_my_city_records() from public, anon;
grant execute on function public.purge_my_city_records() to authenticated;

create or replace function public.purge_all_cities() returns void
language plpgsql security definer set search_path = public as $$
declare c uuid;
begin for c in select city_id from public.city_settings where go_live loop perform public.purge_city_records(c); end loop; end $$;
revoke all on function public.purge_all_cities() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('civicreach-retention-daily', '17 3 * * *', 'select public.purge_all_cities()');

create or replace function public.public_city_config(_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'go_live', s.go_live,
    'profile', s.settings->'profile', 'hours', s.settings->'hours', 'emergency', s.settings->'emergency',
    'targets', s.settings->'targets', 'intake', s.settings->'intake', 'grants', jsonb_build_object('min', s.settings->'grants'->'min', 'max', s.settings->'grants'->'max'),
    'hubs', s.settings->'hubs', 'privacy', jsonb_build_object('consent', s.settings->'privacy'->'consent'),
    'languages', s.settings->'languages')
  from public.cities c join public.city_settings s on s.city_id = c.id where c.slug = _slug and c.status = 'active'
$$;