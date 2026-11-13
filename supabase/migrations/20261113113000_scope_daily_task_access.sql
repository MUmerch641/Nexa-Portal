-- Let staff work on their own tasks while keeping shared task templates intact.
create or replace function private.can_read_app_record(p_module text, p_payload jsonb, p_role text, p_email text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare
  audience text := lower(coalesce(p_payload ->> 'targetAudience', ''));
begin
  if p_role is null then return false; end if;
  if p_role in ('admin', 'manager', 'hr') then return true; end if;
  if p_module = 'attendance_policy' then return true; end if;
  if p_module in ('announcements', 'meetings') then return true; end if;

  if p_role in ('employee', 'intern') then
    if p_module = 'daily_tasks' then
      return private.record_matches_user(p_payload, p_email)
        or (p_role = 'intern' and (audience like '%all remote & onsite interns%' or audience like '%all interns%'))
        or (p_role = 'employee' and (audience like '%all paid staff%' or audience like '%all staff%' or audience like '%all employees%'));
    end if;
    if p_module in ('projects', 'tasks', 'comments', 'bug_reports', 'milestones', 'clients') then return true; end if;
    if p_module in ('employees', 'students', 'interns', 'attendance', 'student_attendance', 'leaves', 'complaints',
      'activity_logs', 'employee_activity_statuses', 'remote_work_sessions', 'monitoring_sessions',
      'screenshot_logs', 'app_usage_logs', 'work_timelines', 'productivity_reports')
      then return private.record_matches_user(p_payload, p_email); end if;
    return false;
  end if;

  if p_role = 'student' then
    if p_module = 'mcq_exams' then return true; end if;
    if p_module = 'daily_tasks' then
      return private.record_matches_user(p_payload, p_email)
        or audience like '%all enrolled students%'
        or audience like '%all students%';
    end if;
    if p_module in ('students', 'attendance', 'student_attendance', 'complaints', 'mcq_attempts')
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
      'remote_work_sessions', 'monitoring_sessions', 'screenshot_logs', 'app_usage_logs', 'work_timelines', 'daily_tasks')
      then return private.record_matches_user(p_payload, p_email); end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;
  if p_role = 'student' then
    if p_module in ('attendance', 'student_attendance', 'daily_tasks', 'complaints', 'mcq_attempts')
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

revoke all on function private.can_read_app_record(text, jsonb, text, text) from public, anon;
revoke all on function private.can_write_app_record(text, jsonb, text, text) from public, anon;
grant execute on function private.can_read_app_record(text, jsonb, text, text) to authenticated;
grant execute on function private.can_write_app_record(text, jsonb, text, text) to authenticated;
