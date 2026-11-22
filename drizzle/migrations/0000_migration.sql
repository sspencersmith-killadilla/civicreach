create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'outreach' check (role in ('outreach','supervisor')),
  team_zone text default 'Central',
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (full_name, team_zone) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.staff_role(_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = _uid
$$;
create or replace function public.is_staff(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = _uid and role in ('outreach','supervisor'))
$$;

create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()) or id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 'outreach');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.diversion_requests (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  living_situation text not null,
  barrier_type text not null,
  amount_requested integer not null check (amount_requested between 50 and 1000),
  contact_info jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','claimed','approved','paid','closed')),
  assigned_worker_id uuid,
  created_at timestamptz not null default now()
);
grant insert on public.diversion_requests to anon, authenticated;
grant select, update, delete on public.diversion_requests to authenticated;
grant all on public.diversion_requests to service_role;
alter table public.diversion_requests enable row level security;
create policy "public submit diversion" on public.diversion_requests for insert to anon, authenticated with check (status = 'new' and assigned_worker_id is null);
create policy "staff read diversion" on public.diversion_requests for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update diversion" on public.diversion_requests for update to authenticated using (public.is_staff(auth.uid()));

create table public.wellness_checks (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  location_text text not null,
  lat double precision,
  lng double precision,
  urgency_tags text[] not null default '{}',
  description text,
  photo_path text,
  status text not null default 'unassigned' check (status in ('unassigned','en_route','resolved')),
  assigned_worker_id uuid,
  created_at timestamptz not null default now()
);
grant insert on public.wellness_checks to anon, authenticated;
grant select, update on public.wellness_checks to authenticated;
grant all on public.wellness_checks to service_role;
alter table public.wellness_checks enable row level security;
create policy "public submit wellness" on public.wellness_checks for insert to anon, authenticated with check (status = 'unassigned' and assigned_worker_id is null);
create policy "staff read wellness" on public.wellness_checks for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update wellness" on public.wellness_checks for update to authenticated using (public.is_staff(auth.uid()));

create table public.ride_dispatches (
  id uuid primary key default gen_random_uuid(),
  wellness_check_id uuid references public.wellness_checks(id) on delete set null,
  ride_type text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  destination text not null,
  dispatched_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert on public.ride_dispatches to authenticated;
grant all on public.ride_dispatches to service_role;
alter table public.ride_dispatches enable row level security;
create policy "staff rides read" on public.ride_dispatches for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff rides insert" on public.ride_dispatches for insert to authenticated with check (public.is_staff(auth.uid()) and dispatched_by = auth.uid());

create table public.field_encounters (
  id uuid primary key default gen_random_uuid(),
  client_ref text unique,
  worker_id uuid not null default auth.uid(),
  lat double precision,
  lng double precision,
  service_chips text[] not null default '{}',
  private_clinical_note text,
  synced_from_offline boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.field_encounters to authenticated;
grant all on public.field_encounters to service_role;
alter table public.field_encounters enable row level security;
create policy "staff encounters read" on public.field_encounters for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff encounters insert" on public.field_encounters for insert to authenticated with check (public.is_staff(auth.uid()) and worker_id = auth.uid());
create policy "own encounters update" on public.field_encounters for update to authenticated using (public.is_staff(auth.uid()) and worker_id = auth.uid());
create policy "own encounters delete" on public.field_encounters for delete to authenticated using (public.is_staff(auth.uid()) and worker_id = auth.uid());

create table public.diversion_fund (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_amount numeric(12,2) not null,
  balance numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.diversion_fund to authenticated;
grant all on public.diversion_fund to service_role;
alter table public.diversion_fund enable row level security;
create policy "staff fund read" on public.diversion_fund for select to authenticated using (public.is_staff(auth.uid()));

create table public.micro_grants (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.diversion_requests(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0 and amount <= 1000),
  payee_name text not null,
  payment_method text not null,
  approved_by uuid,
  requested_by uuid not null,
  status text not null default 'pending_supervisor' check (status in ('pending_supervisor','approved','paid','denied')),
  created_at timestamptz not null default now()
);
grant select on public.micro_grants to authenticated;
grant all on public.micro_grants to service_role;
alter table public.micro_grants enable row level security;
create policy "staff grants read" on public.micro_grants for select to authenticated using (public.is_staff(auth.uid()));

-- Grant workflow: <=250 auto-approved by outreach; 251-1000 needs supervisor
create or replace function public.submit_micro_grant(_request_id uuid, _amount numeric, _payee text, _method text)
returns public.micro_grants language plpgsql security definer set search_path = public as $$
declare r text := public.staff_role(auth.uid()); g public.micro_grants; f public.diversion_fund;
begin
  if r is null then raise exception 'Not authorized'; end if;
  if _amount <= 0 or _amount > 1000 then raise exception 'Amount must be between $1 and $1,000'; end if;
  if coalesce(trim(_payee),'') = '' then raise exception 'Payee is required'; end if;
  if _amount <= 250 or r = 'supervisor' then
    select * into f from public.diversion_fund where active order by created_at limit 1 for update;
    if f.id is null or f.balance < _amount then raise exception 'Insufficient diversion pool balance'; end if;
    update public.diversion_fund set balance = balance - _amount where id = f.id;
    insert into public.micro_grants(request_id, amount, payee_name, payment_method, approved_by, requested_by, status)
      values (_request_id, _amount, _payee, _method, auth.uid(), auth.uid(), 'approved') returning * into g;
    update public.diversion_requests set status = 'approved', assigned_worker_id = coalesce(assigned_worker_id, auth.uid()) where id = _request_id;
  else
    insert into public.micro_grants(request_id, amount, payee_name, payment_method, requested_by, status)
      values (_request_id, _amount, _payee, _method, auth.uid(), 'pending_supervisor') returning * into g;
    update public.diversion_requests set status = 'claimed', assigned_worker_id = coalesce(assigned_worker_id, auth.uid()) where id = _request_id;
  end if;
  return g;
end $$;

create or replace function public.decide_micro_grant(_grant_id uuid, _approve boolean)
returns public.micro_grants language plpgsql security definer set search_path = public as $$
declare g public.micro_grants; f public.diversion_fund;
begin
  if public.staff_role(auth.uid()) is distinct from 'supervisor' then raise exception 'Supervisor approval required'; end if;
  select * into g from public.micro_grants where id = _grant_id for update;
  if g.status <> 'pending_supervisor' then raise exception 'Grant already decided'; end if;
  if _approve then
    select * into f from public.diversion_fund where active order by created_at limit 1 for update;
    if f.balance < g.amount then raise exception 'Insufficient diversion pool balance'; end if;
    update public.diversion_fund set balance = balance - g.amount where id = f.id;
    update public.micro_grants set status = 'approved', approved_by = auth.uid() where id = g.id returning * into g;
    update public.diversion_requests set status = 'approved' where id = g.request_id;
  else
    update public.micro_grants set status = 'denied', approved_by = auth.uid() where id = g.id returning * into g;
  end if;
  return g;
end $$;
revoke execute on function public.submit_micro_grant(uuid,numeric,text,text) from anon, public;
revoke execute on function public.decide_micro_grant(uuid,boolean) from anon, public;
grant execute on function public.submit_micro_grant(uuid,numeric,text,text) to authenticated;
grant execute on function public.decide_micro_grant(uuid,boolean) to authenticated;

create table public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_alias text not null,
  doc_type text not null check (doc_type in ('id','birth_certificate','dd214','disability_verification')),
  storage_path text not null,
  consent_verified boolean not null default false,
  expires_on date,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.client_documents to authenticated;
grant all on public.client_documents to service_role;
alter table public.client_documents enable row level security;
create policy "staff docs read" on public.client_documents for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff docs insert" on public.client_documents for insert to authenticated with check (public.is_staff(auth.uid()) and consent_verified = true and uploaded_by = auth.uid());
create policy "staff docs delete" on public.client_documents for delete to authenticated using (public.is_staff(auth.uid()));

alter publication supabase_realtime add table public.wellness_checks;
alter publication supabase_realtime add table public.diversion_requests;

insert into public.diversion_fund (name, total_amount, balance) values ('Flexible Diversion Fund FY27', 25000, 25000);

insert into public.wellness_checks (tracking_code, location_text, lat, lng, urgency_tags, description, status, created_at) values
('WC7K2P','5th & Main bus shelter',37.7793,-122.4193,'{heat_cold,medical_mobility}','Older man in wheelchair, no shade, seems disoriented.','unassigned', now() - interval '12 minutes'),
('WC3M9Q','Riverside Park, north pavilion',37.7841,-122.4110,'{basic_supplies}','Family with two kids sleeping under pavilion. Asked for water.','unassigned', now() - interval '34 minutes'),
('WC8T4N','Central Library side entrance',37.7786,-122.4158,'{welfare_check}','Young woman has been sitting in the same spot since morning.','en_route', now() - interval '55 minutes'),
('WC5R1H','Oak St underpass near 9th',37.7752,-122.4231,'{heat_cold,basic_supplies}','Two people, thin blankets, temps dropping tonight.','unassigned', now() - interval '1 hour 20 minutes'),
('WC2B6V','Transit Center platform B',37.7897,-122.3972,'{medical_mobility}','Man with swollen foot wound, limping.','resolved', now() - interval '5 hours');

insert into public.diversion_requests (tracking_code, living_situation, barrier_type, amount_requested, contact_info, status, created_at) values
('DV4H8L','in_car','car_repair',420,'{"method":"phone","value":"(555) 201-4432"}','new', now() - interval '20 minutes'),
('DV9C2X','eviction_7_days','rent_arrears',850,'{"method":"email","value":"maria.r@example.com"}','new', now() - interval '1 hour'),
('DV1N7E','couch_surfing','bus_ticket',140,'{"method":"hub","value":"Central Library"}','new', now() - interval '2 hours'),
('DV6P3J','eviction_7_days','utility_shutoff',210,'{"method":"phone","value":"(555) 873-1190"}','claimed', now() - interval '3 hours'),
('DV2W5K','sleeping_outside','lost_id',60,'{"method":"hub","value":"Eastside Resource Hub"}','new', now() - interval '4 hours');
