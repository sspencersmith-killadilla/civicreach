create table public.city_settings (
  city_id uuid primary key references public.cities(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  go_live boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select on public.city_settings to authenticated;
grant all on public.city_settings to service_role;
alter table public.city_settings enable row level security;
create policy "own city staff read settings" on public.city_settings for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  actor_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "own city staff read audit" on public.audit_log for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));

insert into public.city_settings(city_id) select id from public.cities on conflict do nothing;

create or replace function public.ensure_city_settings() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.city_settings(city_id) values (new.id) on conflict do nothing; return new; end $$;
create trigger cities_settings_row after insert on public.cities for each row execute function public.ensure_city_settings();

create or replace function public.update_city_settings(_settings jsonb, _go_live boolean)
returns public.city_settings language plpgsql security definer set search_path = public as $$
declare c uuid := public.current_city_id(); s public.city_settings;
begin
  if c is null or public.staff_role(auth.uid()) <> 'supervisor' then raise exception 'Only supervisors can change city settings'; end if;
  if jsonb_typeof(_settings) <> 'object' or length(_settings::text) > 200000 then raise exception 'Invalid settings'; end if;
  update public.city_settings set settings = _settings, go_live = _go_live, updated_by = auth.uid(), updated_at = now()
    where city_id = c returning * into s;
  insert into public.audit_log(city_id, actor_id, action, details) values (c, auth.uid(), 'settings.updated', jsonb_build_object('go_live', _go_live));
  return s;
end $$;
revoke all on function public.update_city_settings(jsonb, boolean) from public, anon;
grant execute on function public.update_city_settings(jsonb, boolean) to authenticated;

create or replace function public.public_city_config(_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'go_live', s.go_live,
    'profile', s.settings->'profile', 'hours', s.settings->'hours', 'emergency', s.settings->'emergency',
    'targets', s.settings->'targets', 'intake', s.settings->'intake', 'grants', jsonb_build_object('min', s.settings->'grants'->'min', 'max', s.settings->'grants'->'max'),
    'hubs', s.settings->'hubs', 'privacy', jsonb_build_object('consent', s.settings->'privacy'->'consent'))
  from public.cities c join public.city_settings s on s.city_id = c.id where c.slug = _slug and c.status = 'active'
$$;
grant execute on function public.public_city_config(text) to anon, authenticated;

create or replace function public.city_grant_limit(_city uuid, _key text, _default numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select nullif(settings->'grants'->>_key,'')::numeric from public.city_settings where city_id = _city), _default)
$$;

create or replace function public.submit_micro_grant(_request_id uuid, _amount numeric, _payee text, _method text)
returns public.micro_grants language plpgsql security definer set search_path = public as $$
declare r text := public.staff_role(auth.uid()); c uuid := public.current_city_id(); req public.diversion_requests; g public.micro_grants; f public.diversion_fund;
  lo numeric; hi numeric; auto numeric;
begin
  if r is null or c is null then raise exception 'Not authorized'; end if;
  lo := public.city_grant_limit(c, 'min', 1); hi := public.city_grant_limit(c, 'max', 1000); auto := public.city_grant_limit(c, 'workerLimit', 250);
  if _amount < lo or _amount <= 0 or _amount > hi then raise exception 'Amount must be between $% and $%', lo, hi; end if;
  if coalesce(trim(_payee),'') = '' then raise exception 'Payee is required'; end if;
  select * into req from public.diversion_requests where id = _request_id and city_id = c;
  if req.id is null then raise exception 'Request not found in your city'; end if;
  if _amount <= auto or r = 'supervisor' then
    select * into f from public.diversion_fund where city_id = c and active order by created_at limit 1 for update;
    if f.id is null or f.balance < _amount then raise exception 'Insufficient diversion pool balance'; end if;
    update public.diversion_fund set balance = balance - _amount where id = f.id and city_id = c;
    insert into public.micro_grants(city_id, request_id, amount, payee_name, payment_method, approved_by, requested_by, status)
      values (c, _request_id, _amount, _payee, _method, auth.uid(), auth.uid(), 'approved') returning * into g;
    update public.diversion_requests set status = 'approved', assigned_worker_id = coalesce(assigned_worker_id, auth.uid()) where id = _request_id and city_id = c;
    insert into public.audit_log(city_id, actor_id, action, details) values (c, auth.uid(), 'grant.approved', jsonb_build_object('grant_id', g.id, 'amount', _amount));
  else
    insert into public.micro_grants(city_id, request_id, amount, payee_name, payment_method, requested_by, status)
      values (c, _request_id, _amount, _payee, _method, auth.uid(), 'pending_supervisor') returning * into g;
    update public.diversion_requests set status = 'claimed', assigned_worker_id = coalesce(assigned_worker_id, auth.uid()) where id = _request_id and city_id = c;
    insert into public.audit_log(city_id, actor_id, action, details) values (c, auth.uid(), 'grant.requested', jsonb_build_object('grant_id', g.id, 'amount', _amount));
  end if;
  return g;
end $$;