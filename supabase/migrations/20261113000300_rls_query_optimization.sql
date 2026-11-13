-- Cover the app_records.created_by foreign key and cache identity lookups once
-- per statement in RLS policies rather than evaluating auth functions per row.
create index if not exists app_records_created_by_idx on public.app_records (created_by);

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = ''
as $$
  select p.role from public.user_profiles as p
  where p.id = (select auth.uid()) and p.status = 'active' limit 1;
$$;

create or replace function private.record_matches_user(p_payload jsonb, p_email text)
returns boolean language sql stable set search_path = ''
as $$
  select coalesce(p_email, '') <> '' and lower(p_email) in (
    lower(coalesce(p_payload ->> 'email', '')),
    lower(coalesce(p_payload ->> 'user_email', '')),
    lower(coalesce(p_payload ->> 'student_email', '')),
    lower(coalesce(p_payload ->> 'employee_email', '')),
    lower(coalesce(p_payload ->> 'assigned_to_email', '')),
    lower(coalesce(p_payload ->> 'client_email', '')),
    lower(coalesce(p_payload ->> 'clientEmail', ''))
  );
$$;

create or replace function private.user_is_linked_student(p_student_id text, p_email text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.app_records as student
    where student.module = 'students'
      and student.payload ->> 'id' = p_student_id
      and lower(coalesce(student.payload ->> 'email', '')) = lower(coalesce(p_email, ''))
  );
$$;

create or replace function private.can_read_app_record(p_module text, p_payload jsonb, p_role text, p_email text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
begin
  if p_role is null then return false; end if;
  if p_role in ('admin', 'manager', 'hr') then return true; end if;
  if p_module = 'attendance_policy' then return true; end if;
  if p_module in ('announcements', 'meetings') then return true; end if;
  if p_role in ('employee', 'intern') then
    if p_module in ('projects', 'tasks', 'daily_tasks', 'comments', 'bug_reports', 'milestones', 'clients') then return true; end if;
    if p_module in ('employees', 'students', 'interns', 'attendance', 'student_attendance', 'leaves', 'complaints',
      'activity_logs', 'employee_activity_statuses', 'remote_work_sessions', 'monitoring_sessions',
      'screenshot_logs', 'app_usage_logs', 'work_timelines', 'productivity_reports')
      then return private.record_matches_user(p_payload, p_email); end if;
    return false;
  end if;
  if p_role = 'student' then
    if p_module = 'mcq_exams' then return true; end if;
    if p_module in ('students', 'attendance', 'student_attendance', 'daily_tasks', 'complaints', 'mcq_attempts')
      then return private.record_matches_user(p_payload, p_email)
        or (p_module = 'student_attendance' and private.user_is_linked_student(p_payload ->> 'student_id', p_email));
    end if;
    if p_module = 'student_fee_cycles' then return private.user_is_linked_student(p_payload ->> 'student_id', p_email); end if;
    return false;
  end if;
  if p_role = 'client' then
    if p_module in ('projects', 'invoices', 'milestones', 'tasks', 'comments', 'bug_reports', 'meetings', 'users', 'clients')
      then return private.record_matches_user(p_payload, p_email); end if;
    return false;
  end if;
  return false;
end;
$$;

create or replace function private.can_write_app_record(p_module text, p_payload jsonb, p_role text, p_email text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
begin
  if p_role is null then return false; end if;
  if p_role in ('admin', 'manager', 'hr') then return true; end if;
  if p_role in ('employee', 'intern') then
    if p_module in ('attendance', 'leaves', 'complaints', 'activity_logs', 'employee_activity_statuses',
      'remote_work_sessions', 'monitoring_sessions', 'screenshot_logs', 'app_usage_logs', 'work_timelines')
      then return private.record_matches_user(p_payload, p_email); end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;
  if p_role = 'student' then
    if p_module in ('attendance', 'student_attendance', 'complaints', 'mcq_attempts')
      then return private.record_matches_user(p_payload, p_email)
        or (p_module = 'student_attendance' and private.user_is_linked_student(p_payload ->> 'student_id', p_email));
    end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;
  if p_role = 'client' and p_module in ('comments', 'bug_reports') then
    return private.record_matches_user(p_payload, p_email);
  end if;
  return false;
end;
$$;

revoke all on function private.record_matches_user(jsonb, text) from public, anon;
revoke all on function private.user_is_linked_student(text, text) from public, anon;
revoke all on function private.can_read_app_record(text, jsonb, text, text) from public, anon;
revoke all on function private.can_write_app_record(text, jsonb, text, text) from public, anon;
grant execute on function private.record_matches_user(jsonb, text) to authenticated;
grant execute on function private.user_is_linked_student(text, text) to authenticated;
grant execute on function private.can_read_app_record(text, jsonb, text, text) to authenticated;
grant execute on function private.can_write_app_record(text, jsonb, text, text) to authenticated;

drop policy if exists user_profiles_read_self_or_admin on public.user_profiles;
create policy user_profiles_read_self_or_admin on public.user_profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_portal_admin()));

drop policy if exists user_profiles_admin_update on public.user_profiles;
create policy user_profiles_admin_update on public.user_profiles
  for update to authenticated
  using ((select private.is_portal_admin()))
  with check ((select private.is_portal_admin()));

drop policy if exists app_records_select_by_role on public.app_records;
create policy app_records_select_by_role on public.app_records
  for select to authenticated
  using (private.can_read_app_record(module, payload, (select private.current_app_role()), (select private.current_app_email())));

drop policy if exists app_records_insert_by_role on public.app_records;
create policy app_records_insert_by_role on public.app_records
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.can_write_app_record(module, payload, (select private.current_app_role()), (select private.current_app_email())));

drop policy if exists app_records_update_by_role on public.app_records;
create policy app_records_update_by_role on public.app_records
  for update to authenticated
  using (private.can_write_app_record(module, payload, (select private.current_app_role()), (select private.current_app_email())))
  with check (private.can_write_app_record(module, payload, (select private.current_app_role()), (select private.current_app_email())));

drop policy if exists app_records_delete_by_role on public.app_records;
create policy app_records_delete_by_role on public.app_records
  for delete to authenticated
  using (private.can_write_app_record(module, payload, (select private.current_app_role()), (select private.current_app_email())));
