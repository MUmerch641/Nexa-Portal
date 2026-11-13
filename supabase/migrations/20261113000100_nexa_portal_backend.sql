-- Nexa Portal: shared application records and identity-based access.
-- Passwords remain in Supabase Auth and are never stored in application rows.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'pending'
    check (role in ('pending', 'admin', 'manager', 'hr', 'employee', 'intern', 'student', 'client')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_lower_idx on public.user_profiles (lower(email));
alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon, authenticated;
grant select on public.user_profiles to authenticated;

create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in (
    'activity_logs', 'announcements', 'app_users', 'attendance', 'attendance_policy',
    'bug_reports', 'certificates', 'clients', 'client_projects', 'comments', 'complaints',
    'daily_tasks', 'employee_activity_statuses', 'employees', 'expenses', 'incomes', 'interns',
    'invoices', 'leaves', 'mcq_attempts', 'mcq_exams', 'meetings', 'milestones',
    'monitoring_sessions', 'payrolls', 'performances', 'projects', 'productivity_reports',
    'registered_accounts', 'remote_work_sessions', 'salary', 'screenshot_logs', 'settings',
    'student_attendance', 'student_fee_cycles', 'students', 'tasks', 'users', 'utility_bills',
    'work_timelines'
  )),
  record_key text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module, record_key)
);

create index if not exists app_records_module_created_idx on public.app_records (module, created_at desc);
create index if not exists app_records_payload_gin_idx on public.app_records using gin (payload jsonb_path_ops);
alter table public.app_records enable row level security;
revoke all on public.app_records from anon, authenticated;
grant select, insert, update, delete on public.app_records to authenticated;

create or replace function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.user_profiles as p
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function private.current_app_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function private.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_app_role() in ('admin', 'manager', 'hr'), false);
$$;

create or replace function private.record_matches_user(p_payload jsonb)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.current_app_email() <> '' and private.current_app_email() in (
    lower(coalesce(p_payload ->> 'email', '')),
    lower(coalesce(p_payload ->> 'user_email', '')),
    lower(coalesce(p_payload ->> 'student_email', '')),
    lower(coalesce(p_payload ->> 'employee_email', '')),
    lower(coalesce(p_payload ->> 'assigned_to_email', '')),
    lower(coalesce(p_payload ->> 'client_email', '')),
    lower(coalesce(p_payload ->> 'clientEmail', ''))
  );
$$;

create or replace function private.user_is_linked_student(p_student_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_records as student
    where student.module = 'students'
      and student.payload ->> 'id' = p_student_id
      and lower(coalesce(student.payload ->> 'email', '')) = private.current_app_email()
  );
$$;

create or replace function private.can_read_app_record(p_module text, p_payload jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  app_role text := private.current_app_role();
begin
  if app_role is null then return false; end if;
  if app_role in ('admin', 'manager', 'hr') then return true; end if;

  if p_module = 'attendance_policy' then return true; end if;
  if p_module in ('announcements', 'meetings') then return true; end if;

  if app_role in ('employee', 'intern') then
    if p_module in ('projects', 'tasks', 'daily_tasks', 'comments', 'bug_reports', 'milestones', 'clients') then return true; end if;
    if p_module in (
      'employees', 'students', 'interns', 'attendance', 'student_attendance', 'leaves', 'complaints',
      'activity_logs', 'employee_activity_statuses', 'remote_work_sessions', 'monitoring_sessions',
      'screenshot_logs', 'app_usage_logs', 'work_timelines', 'productivity_reports'
    ) then return private.record_matches_user(p_payload); end if;
    return false;
  end if;

  if app_role = 'student' then
    if p_module in ('students', 'attendance', 'student_attendance', 'daily_tasks', 'complaints', 'mcq_exams', 'mcq_attempts')
      then return private.record_matches_user(p_payload)
        or (p_module in ('student_attendance', 'student_fee_cycles') and private.user_is_linked_student(p_payload ->> 'student_id'));
    end if;
    if p_module = 'student_fee_cycles' then return private.user_is_linked_student(p_payload ->> 'student_id'); end if;
    return false;
  end if;

  if app_role = 'client' then
    if p_module in ('projects', 'invoices', 'milestones', 'tasks', 'comments', 'bug_reports', 'meetings', 'users', 'clients')
      then return private.record_matches_user(p_payload); end if;
    return false;
  end if;

  return false;
end;
$$;

create or replace function private.can_write_app_record(p_module text, p_payload jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  app_role text := private.current_app_role();
begin
  if app_role is null then return false; end if;
  if app_role in ('admin', 'manager', 'hr') then return true; end if;

  if app_role in ('employee', 'intern') then
    if p_module in ('attendance', 'leaves', 'complaints', 'activity_logs', 'employee_activity_statuses',
      'remote_work_sessions', 'monitoring_sessions', 'screenshot_logs', 'app_usage_logs', 'work_timelines')
      then return private.record_matches_user(p_payload); end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;

  if app_role = 'student' then
    if p_module in ('attendance', 'student_attendance', 'complaints', 'mcq_attempts')
      then return private.record_matches_user(p_payload)
        or (p_module = 'student_attendance' and private.user_is_linked_student(p_payload ->> 'student_id'));
    end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;

  if app_role = 'client' and p_module in ('comments', 'bug_reports') then
    return private.record_matches_user(p_payload);
  end if;
  return false;
end;
$$;

revoke all on function private.current_app_role() from public, anon;
revoke all on function private.current_app_email() from public, anon;
revoke all on function private.is_portal_admin() from public, anon;
revoke all on function private.record_matches_user(jsonb) from public, anon;
revoke all on function private.user_is_linked_student(text) from public, anon;
revoke all on function private.can_read_app_record(text, jsonb) from public, anon;
revoke all on function private.can_write_app_record(text, jsonb) from public, anon;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.current_app_email() to authenticated;
grant execute on function private.is_portal_admin() to authenticated;
grant execute on function private.record_matches_user(jsonb) to authenticated;
grant execute on function private.user_is_linked_student(text) to authenticated;
grant execute on function private.can_read_app_record(text, jsonb) to authenticated;
grant execute on function private.can_write_app_record(text, jsonb) to authenticated;

drop policy if exists user_profiles_read_self_or_admin on public.user_profiles;
create policy user_profiles_read_self_or_admin on public.user_profiles
  for select to authenticated
  using (id = auth.uid() or private.is_portal_admin());

drop policy if exists app_records_select_by_role on public.app_records;
create policy app_records_select_by_role on public.app_records
  for select to authenticated
  using (private.can_read_app_record(module, payload));

drop policy if exists app_records_insert_by_role on public.app_records;
create policy app_records_insert_by_role on public.app_records
  for insert to authenticated
  with check (created_by = auth.uid() and private.can_write_app_record(module, payload));

drop policy if exists app_records_update_by_role on public.app_records;
create policy app_records_update_by_role on public.app_records
  for update to authenticated
  using (private.can_write_app_record(module, payload))
  with check (private.can_write_app_record(module, payload));

drop policy if exists app_records_delete_by_role on public.app_records;
create policy app_records_delete_by_role on public.app_records
  for delete to authenticated
  using (private.can_write_app_record(module, payload));

create or replace function public.handle_new_nexa_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, email, full_name, role, status)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'pending',
    'pending'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_nexa_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_nexa on auth.users;
create trigger on_auth_user_created_nexa
  after insert on auth.users
  for each row execute function public.handle_new_nexa_user();

-- This function is used only by the project's CREATE TABLE event trigger.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
