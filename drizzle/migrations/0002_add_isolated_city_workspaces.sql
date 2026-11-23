create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  region text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.cities to anon, authenticated;
grant all on public.cities to service_role;
alter table public.cities enable row level security;
create policy "active cities are publicly discoverable" on public.cities
  for select to anon, authenticated using (status = 'active');

insert into public.cities (id, name, slug, region)
values ('00000000-0000-4000-8000-000000000001', 'Demo City', 'demo', 'Sample workspace');

alter table public.profiles add column city_id uuid references public.cities(id);
update public.profiles set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
comment on column public.profiles.role is 'DEPRECATED: roles are enforced through public.user_roles; retained only for migration history.';

create type public.app_role as enum ('outreach', 'supervisor');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, city_id)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
insert into public.user_roles (user_id, city_id, role)
select id, city_id, role::public.app_role from public.profiles where city_id is not null;

create or replace function public.current_city_id() returns uuid
language sql stable security definer set search_path = public as $$
  select city_id from public.profiles where id = auth.uid()
$$;
create or replace function public.staff_role(_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.user_roles
  where user_id = _uid and city_id = (select city_id from public.profiles where id = _uid)
$$;
create or replace function public.is_staff(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.staff_role(_uid) in ('outreach','supervisor')
$$;

create policy "own or same city roles read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or (city_id = public.current_city_id() and public.is_staff(auth.uid())));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop policy "staff read profiles" on public.profiles;
create policy "own or same city profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or (city_id = public.current_city_id() and public.is_staff(auth.uid())));

alter table public.diversion_requests add column city_id uuid references public.cities(id) default public.current_city_id();
alter table public.wellness_checks add column city_id uuid references public.cities(id) default public.current_city_id();
alter table public.ride_dispatches add column city_id uuid references public.cities(id) default public.current_city_id();
alter table public.field_encounters add column city_id uuid references public.cities(id) default public.current_city_id();
alter table public.diversion_fund add column city_id uuid references public.cities(id) default public.current_city_id();
alter table public.micro_grants add column city_id uuid references public.cities(id) default public.current_city_id();
alter table public.client_documents add column city_id uuid references public.cities(id) default public.current_city_id();

update public.diversion_requests set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
update public.wellness_checks set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
update public.ride_dispatches set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
update public.field_encounters set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
update public.diversion_fund set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
update public.micro_grants set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;
update public.client_documents set city_id = '00000000-0000-4000-8000-000000000001' where city_id is null;

alter table public.diversion_requests alter column city_id set not null;
alter table public.wellness_checks alter column city_id set not null;
alter table public.ride_dispatches alter column city_id set not null;
alter table public.field_encounters alter column city_id set not null;
alter table public.diversion_fund alter column city_id set not null;
alter table public.micro_grants alter column city_id set not null;
alter table public.client_documents alter column city_id set not null;

create index diversion_requests_city_status on public.diversion_requests(city_id, status);
create index wellness_checks_city_status on public.wellness_checks(city_id, status);
create index field_encounters_city_created on public.field_encounters(city_id, created_at desc);
create index micro_grants_city_status on public.micro_grants(city_id, status);
create index client_documents_city on public.client_documents(city_id);

drop policy "public submit diversion" on public.diversion_requests;
drop policy "staff read diversion" on public.diversion_requests;
drop policy "staff update diversion" on public.diversion_requests;
create policy "public submit diversion to active city" on public.diversion_requests for insert to anon, authenticated
  with check (status = 'new' and assigned_worker_id is null and exists (select 1 from public.cities c where c.id = city_id and c.status = 'active'));
create policy "own city staff read diversion" on public.diversion_requests for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));
create policy "own city staff update diversion" on public.diversion_requests for update to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()))
  with check (city_id = public.current_city_id() and public.is_staff(auth.uid()));

drop policy "public submit wellness" on public.wellness_checks;
drop policy "staff read wellness" on public.wellness_checks;
drop policy "staff update wellness" on public.wellness_checks;
create policy "public submit wellness to active city" on public.wellness_checks for insert to anon, authenticated
  with check (status = 'unassigned' and assigned_worker_id is null and exists (select 1 from public.cities c where c.id = city_id and c.status = 'active'));
create policy "own city staff read wellness" on public.wellness_checks for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));
create policy "own city staff update wellness" on public.wellness_checks for update to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()))
  with check (city_id = public.current_city_id() and public.is_staff(auth.uid()));

drop policy "staff rides read" on public.ride_dispatches;
drop policy "staff rides insert" on public.ride_dispatches;
create policy "own city staff rides read" on public.ride_dispatches for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));
create policy "own city staff rides insert" on public.ride_dispatches for insert to authenticated
  with check (city_id = public.current_city_id() and dispatched_by = auth.uid() and public.is_staff(auth.uid()));

drop policy "staff encounters read" on public.field_encounters;
drop policy "staff encounters insert" on public.field_encounters;
drop policy "own encounters update" on public.field_encounters;
drop policy "own encounters delete" on public.field_encounters;
create policy "own city staff encounters read" on public.field_encounters for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));
create policy "own city staff encounters insert" on public.field_encounters for insert to authenticated
  with check (city_id = public.current_city_id() and worker_id = auth.uid() and public.is_staff(auth.uid()));
create policy "own city own encounters update" on public.field_encounters for update to authenticated
  using (city_id = public.current_city_id() and worker_id = auth.uid() and public.is_staff(auth.uid()))
  with check (city_id = public.current_city_id() and worker_id = auth.uid() and public.is_staff(auth.uid()));
create policy "own city own encounters delete" on public.field_encounters for delete to authenticated
  using (city_id = public.current_city_id() and worker_id = auth.uid() and public.is_staff(auth.uid()));

drop policy "staff fund read" on public.diversion_fund;
create policy "own city staff fund read" on public.diversion_fund for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));

drop policy "staff grants read" on public.micro_grants;
create policy "own city staff grants read" on public.micro_grants for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));

drop policy "staff docs read" on public.client_documents;
drop policy "staff docs insert" on public.client_documents;
drop policy "staff docs delete" on public.client_documents;
create policy "own city staff docs read" on public.client_documents for select to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));
create policy "own city staff docs insert" on public.client_documents for insert to authenticated
  with check (city_id = public.current_city_id() and consent_verified = true and uploaded_by = auth.uid() and public.is_staff(auth.uid()));
create policy "own city staff docs delete" on public.client_documents for delete to authenticated
  using (city_id = public.current_city_id() and public.is_staff(auth.uid()));

drop policy "staff read client docs" on storage.objects;
drop policy "staff upload client docs" on storage.objects;
drop policy "staff delete client docs" on storage.objects;
drop policy "public upload wellness photos" on storage.objects;
drop policy "staff read wellness photos" on storage.objects;
create policy "own city staff read client docs" on storage.objects for select to authenticated
  using (bucket_id = 'client-documents' and public.is_staff(auth.uid()) and split_part(name, '/', 1) = public.current_city_id()::text);
create policy "own city staff upload client docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'client-documents' and public.is_staff(auth.uid()) and split_part(name, '/', 1) = public.current_city_id()::text);
create policy "own city staff delete client docs" on storage.objects for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_staff(auth.uid()) and split_part(name, '/', 1) = public.current_city_id()::text);
create policy "public upload active city wellness photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'wellness-photos' and exists (select 1 from public.cities c where c.id::text = split_part(name, '/', 1) and c.status = 'active'));
create policy "own city staff read wellness photos" on storage.objects for select to authenticated
  using (bucket_id = 'wellness-photos' and public.is_staff(auth.uid()) and split_part(name, '/', 1) = public.current_city_id()::text);

create or replace function public.submit_micro_grant(_request_id uuid, _amount numeric, _payee text, _method text)
returns public.micro_grants language plpgsql security definer set search_path = public as $$
declare r text := public.staff_role(auth.uid()); c uuid := public.current_city_id(); req public.diversion_requests; g public.micro_grants; f public.diversion_fund;
begin
  if r is null or c is null then raise exception 'Not authorized'; end if;
  if _amount <= 0 or _amount > 1000 then raise exception 'Amount must be between $1 and $1,000'; end if;
  if coalesce(trim(_payee),'') = '' then raise exception 'Payee is required'; end if;
  select * into req from public.diversion_requests where id = _request_id and city_id = c;
  if req.id is null then raise exception 'Request not found in your city'; end if;
  if _amount <= 250 or r = 'supervisor' then
    select * into f from public.diversion_fund where city_id = c and active order by created_at limit 1 for update;
    if f.id is null or f.balance < _amount then raise exception 'Insufficient diversion pool balance'; end if;
    update public.diversion_fund set balance = balance - _amount where id = f.id and city_id = c;
    insert into public.micro_grants(city_id, request_id, amount, payee_name, payment_method, approved_by, requested_by, status)
      values (c, _request_id, _amount, _payee, _method, auth.uid(), auth.uid(), 'approved') returning * into g;
    update public.diversion_requests set status = 'approved', assigned_worker_id = coalesce(assigned_worker_id, auth.uid()) where id = _request_id and city_id = c;
  else
    insert into public.micro_grants(city_id, request_id, amount, payee_name, payment_method, requested_by, status)
      values (c, _request_id, _amount, _payee, _method, auth.uid(), 'pending_supervisor') returning * into g;
    update public.diversion_requests set status = 'claimed', assigned_worker_id = coalesce(assigned_worker_id, auth.uid()) where id = _request_id and city_id = c;
  end if;
  return g;
end $$;

create or replace function public.decide_micro_grant(_grant_id uuid, _approve boolean)
returns public.micro_grants language plpgsql security definer set search_path = public as $$
declare g public.micro_grants; f public.diversion_fund; c uuid := public.current_city_id();
begin
  if c is null or public.staff_role(auth.uid()) is distinct from 'supervisor' then raise exception 'Supervisor approval required'; end if;
  select * into g from public.micro_grants where id = _grant_id and city_id = c for update;
  if g.id is null then raise exception 'Grant not found in your city'; end if;
  if g.status <> 'pending_supervisor' then raise exception 'Grant already decided'; end if;
  if _approve then
    select * into f from public.diversion_fund where city_id = c and active order by created_at limit 1 for update;
    if f.id is null or f.balance < g.amount then raise exception 'Insufficient diversion pool balance'; end if;
    update public.diversion_fund set balance = balance - g.amount where id = f.id and city_id = c;
    update public.micro_grants set status = 'approved', approved_by = auth.uid() where id = g.id and city_id = c returning * into g;
    update public.diversion_requests set status = 'approved' where id = g.request_id and city_id = c;
  else
    update public.micro_grants set status = 'denied', approved_by = auth.uid() where id = g.id and city_id = c returning * into g;
  end if;
  return g;
end $$;

create or replace function public.provision_city(_name text, _region text, _slug text, _user_id uuid, _full_name text, _fund_total numeric)
returns public.cities language plpgsql security definer set search_path = public as $$
declare c public.cities; base text; candidate text; n integer := 1;
begin
  if coalesce(trim(_name),'') = '' or coalesce(trim(_region),'') = '' or coalesce(trim(_full_name),'') = '' then raise exception 'City, region, and supervisor name are required'; end if;
  if _fund_total < 0 or _fund_total > 10000000 then raise exception 'Fund total must be between $0 and $10,000,000'; end if;
  base := substring(lower(regexp_replace(trim(_slug), '[^a-z0-9]+', '-', 'g')) from 1 for 40);
  base := trim(both '-' from base);
  if char_length(base) < 3 then raise exception 'City link must contain at least three letters or numbers'; end if;
  candidate := base;
  while exists(select 1 from public.cities where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  insert into public.cities(name, slug, region, created_by) values (trim(_name), candidate, trim(_region), _user_id) returning * into c;
  insert into public.profiles(id, full_name, city_id) values (_user_id, trim(_full_name), c.id)
    on conflict (id) do update set full_name = excluded.full_name, city_id = excluded.city_id;
  insert into public.user_roles(user_id, city_id, role) values (_user_id, c.id, 'supervisor')
    on conflict (user_id, city_id) do update set role = 'supervisor';
  insert into public.diversion_fund(city_id, name, total_amount, balance) values (c.id, trim(_name) || ' Flexible Diversion Fund', _fund_total, _fund_total);
  return c;
end $$;
revoke execute on function public.provision_city(text,text,text,uuid,text,numeric) from public, anon, authenticated;
grant execute on function public.provision_city(text,text,text,uuid,text,numeric) to service_role;
